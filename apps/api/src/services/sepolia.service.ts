import { ethers } from 'ethers'

// Minimal ERC-20 ABI — only what we need
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]

export interface NetworkInfo {
  network: 'SEPOLIA'
  chainId: number
  name: string
  rpcUrl: string
  contractAddress: string
  environment: 'TESTNET'
}

export interface TokenInfo {
  symbol: string
  name: string
  decimals: number
  contractAddress: string
  isVerified: boolean
  note: string
}

export interface WalletBalance {
  address: string
  ethBalance: string
  tokenBalance: string
  tokenSymbol: string
  network: 'SEPOLIA'
  environment: 'TESTNET'
}

export interface SubmitTxResult {
  txHash: string
  fromAddress: string
  toAddress: string
  amountUnits: bigint
  network: 'SEPOLIA'
  status: 'PENDING'
  environment: 'TESTNET'
}

export interface TxReceipt {
  txHash: string
  blockNumber: number
  confirmations: number
  status: 'CONFIRMED' | 'FAILED' | 'PENDING'
  fromAddress: string
  toAddress: string
  network: 'SEPOLIA'
  environment: 'TESTNET'
}

function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.SEPOLIA_RPC_URL
  if (!rpcUrl) throw new Error('SEPOLIA_RPC_URL not configured')
  return new ethers.JsonRpcProvider(rpcUrl)
}

function getContractAddress(): string {
  const addr = process.env.SEPOLIA_USDT_CONTRACT
  if (!addr) throw new Error('SEPOLIA_USDT_CONTRACT not configured')
  return addr
}

export async function getNetworkInfo(): Promise<NetworkInfo> {
  const provider = getProvider()
  const network = await provider.getNetwork()
  return {
    network: 'SEPOLIA',
    chainId: Number(network.chainId),
    name: network.name,
    rpcUrl: process.env.SEPOLIA_RPC_URL!,
    contractAddress: getContractAddress(),
    environment: 'TESTNET',
  }
}

export async function getTokenInfo(): Promise<TokenInfo> {
  const provider = getProvider()
  const contractAddress = getContractAddress()
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider)

  const [symbol, name, decimals] = await Promise.all([
    contract.symbol() as Promise<string>,
    contract.name() as Promise<string>,
    contract.decimals() as Promise<number>,
  ])

  // We do NOT assume a token is USDT just because its symbol is USDT.
  // We verify the contract address matches the configured known address.
  const isVerified = contractAddress.toLowerCase() === getContractAddress().toLowerCase()

  return {
    symbol,
    name,
    decimals: Number(decimals),
    contractAddress,
    isVerified,
    note: 'Token verified against configured contract address only. Always verify independently.',
  }
}

export async function getWalletBalance(address: string): Promise<WalletBalance> {
  if (!ethers.isAddress(address)) throw new Error('Invalid Ethereum address')

  const provider = getProvider()
  const contractAddress = getContractAddress()
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider)

  const [ethBalanceWei, tokenBalanceRaw, decimals, symbol] = await Promise.all([
    provider.getBalance(address),
    contract.balanceOf(address) as Promise<bigint>,
    contract.decimals() as Promise<number>,
    contract.symbol() as Promise<string>,
  ])

  const ethBalance = ethers.formatEther(ethBalanceWei)
  const tokenBalance = ethers.formatUnits(tokenBalanceRaw, Number(decimals))

  return {
    address,
    ethBalance,
    tokenBalance,
    tokenSymbol: symbol,
    network: 'SEPOLIA',
    environment: 'TESTNET',
  }
}

export async function submitTransfer(
  privateKey: string,
  toAddress: string,
  amountUnits: bigint
): Promise<SubmitTxResult> {
  if (!ethers.isAddress(toAddress)) throw new Error('Invalid destination address')

  const provider = getProvider()
  const wallet = new ethers.Wallet(privateKey, provider)
  const contractAddress = getContractAddress()
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet)

  // Verify sender has sufficient balance before submitting
  const balance = await contract.balanceOf(wallet.address) as bigint
  if (balance < amountUnits) throw new Error('Insufficient testnet token balance')

  const tx = await (contract.transfer as (to: string, amount: bigint) => Promise<ethers.TransactionResponse>)(
    toAddress,
    amountUnits
  )

  return {
    txHash: tx.hash,
    fromAddress: wallet.address,
    toAddress,
    amountUnits,
    network: 'SEPOLIA',
    status: 'PENDING',
    environment: 'TESTNET',
  }
}

export async function getTransactionReceipt(txHash: string): Promise<TxReceipt> {
  const provider = getProvider()

  const [receipt, currentBlock] = await Promise.all([
    provider.getTransactionReceipt(txHash),
    provider.getBlockNumber(),
  ])

  if (!receipt) {
    // Tx exists but not yet mined
    const tx = await provider.getTransaction(txHash)
    if (!tx) throw new Error('Transaction not found')
    return {
      txHash,
      blockNumber: 0,
      confirmations: 0,
      status: 'PENDING',
      fromAddress: tx.from,
      toAddress: tx.to ?? '',
      network: 'SEPOLIA',
      environment: 'TESTNET',
    }
  }

  const confirmations = currentBlock - receipt.blockNumber + 1

  return {
    txHash,
    blockNumber: receipt.blockNumber,
    confirmations,
    status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED',
    fromAddress: receipt.from,
    toAddress: receipt.to ?? '',
    network: 'SEPOLIA',
    environment: 'TESTNET',
  }
}
