import { ethers } from 'ethers'

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
]

function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.ETH_MAINNET_RPC_URL
  if (!rpcUrl) throw new Error('ETH_MAINNET_RPC_URL not configured')
  return new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true })
}

function getContractAddress(): string {
  const addr = process.env.ETH_MAINNET_USDT_CONTRACT
  if (!addr) throw new Error('ETH_MAINNET_USDT_CONTRACT not configured')
  return addr
}

export async function getNetworkInfo() {
  const provider = getProvider()
  const network = await provider.getNetwork()
  return {
    network: 'ETH_MAINNET',
    chainId: Number(network.chainId),
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.ETH_MAINNET_RPC_URL!,
    contractAddress: getContractAddress(),
    environment: 'MAINNET',
    readOnly: true,
  }
}

export async function getTokenInfo() {
  const provider = getProvider()
  const contractAddress = getContractAddress()
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider)

  const [symbol, name, decimals] = await Promise.all([
    contract.symbol() as Promise<string>,
    contract.name() as Promise<string>,
    contract.decimals() as Promise<number>,
  ])

  return {
    symbol,
    name,
    decimals: Number(decimals),
    contractAddress,
    isVerified: true,
    environment: 'MAINNET',
    note: 'Read-only. Verify contract independently: https://etherscan.io/token/' + contractAddress,
  }
}

export async function getWalletBalance(address: string) {
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

  return {
    address,
    ethBalance: ethers.formatEther(ethBalanceWei),
    tokenBalance: ethers.formatUnits(tokenBalanceRaw, Number(decimals)),
    tokenSymbol: symbol,
    network: 'ETH_MAINNET',
    environment: 'MAINNET',
    readOnly: true,
  }
}

export async function getTransactionReceipt(txHash: string) {
  const provider = getProvider()

  const [receipt, currentBlock] = await Promise.all([
    provider.getTransactionReceipt(txHash),
    provider.getBlockNumber(),
  ])

  if (!receipt) {
    const tx = await provider.getTransaction(txHash)
    if (!tx) throw new Error('Transaction not found')
    return {
      txHash,
      blockNumber: 0,
      confirmations: 0,
      status: 'PENDING' as const,
      fromAddress: tx.from,
      toAddress: tx.to ?? '',
      network: 'ETH_MAINNET',
      environment: 'MAINNET',
      explorerUrl: `https://etherscan.io/tx/${txHash}`,
    }
  }

  return {
    txHash,
    blockNumber: receipt.blockNumber,
    confirmations: currentBlock - receipt.blockNumber + 1,
    status: receipt.status === 1 ? 'CONFIRMED' as const : 'FAILED' as const,
    fromAddress: receipt.from,
    toAddress: receipt.to ?? '',
    network: 'ETH_MAINNET',
    environment: 'MAINNET',
    explorerUrl: `https://etherscan.io/tx/${txHash}`,
  }
}
