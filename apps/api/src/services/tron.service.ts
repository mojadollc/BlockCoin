import TronWeb from 'tronweb'

export interface TronNetworkInfo {
  network: 'TRON_NILE'
  fullHost: string
  contractAddress: string
  environment: 'TESTNET'
}

export interface TronTokenInfo {
  symbol: string
  name: string
  decimals: number
  contractAddress: string
  isVerified: boolean
  note: string
}

export interface TronWalletBalance {
  address: string
  trxBalance: string
  tokenBalance: string
  tokenSymbol: string
  network: 'TRON_NILE'
  environment: 'TESTNET'
}

export interface TronSubmitResult {
  txHash: string
  fromAddress: string
  toAddress: string
  amountUnits: bigint
  network: 'TRON_NILE'
  status: 'PENDING'
  environment: 'TESTNET'
}

export interface TronTxReceipt {
  txHash: string
  blockNumber: number
  confirmations: number
  status: 'CONFIRMED' | 'FAILED' | 'PENDING'
  fromAddress: string
  toAddress: string
  network: 'TRON_NILE'
  environment: 'TESTNET'
}

function getTronWeb(privateKey?: string): TronWeb {
  const fullHost = process.env.TRON_NILE_URL
  if (!fullHost) throw new Error('TRON_NILE_URL not configured')

  const headers: Record<string, string> = {}
  if (process.env.TRON_NILE_API_KEY) {
    headers['TRON-PRO-API-KEY'] = process.env.TRON_NILE_API_KEY
  }

  return new TronWeb({ fullHost, headers, privateKey })
}

function getContractAddress(): string {
  const addr = process.env.TRON_NILE_USDT_CONTRACT
  if (!addr) throw new Error('TRON_NILE_USDT_CONTRACT not configured')
  return addr
}

export function getNetworkInfo(): TronNetworkInfo {
  return {
    network: 'TRON_NILE',
    fullHost: process.env.TRON_NILE_URL ?? '',
    contractAddress: getContractAddress(),
    environment: 'TESTNET',
  }
}

export async function getTokenInfo(): Promise<TronTokenInfo> {
  const tronWeb = getTronWeb()
  const contractAddress = getContractAddress()
  const contract = await tronWeb.contract().at(contractAddress)

  const [symbol, name, decimals] = await Promise.all([
    contract.symbol().call(),
    contract.name().call(),
    contract.decimals().call(),
  ])

  const isVerified = contractAddress === getContractAddress()

  return {
    symbol: String(symbol),
    name: String(name),
    decimals: Number(decimals),
    contractAddress,
    isVerified,
    note: 'Token verified against configured contract address only. Always verify independently.',
  }
}

export async function getWalletBalance(address: string): Promise<TronWalletBalance> {
  const tronWeb = getTronWeb()
  if (!tronWeb.address.isAddress(address)) throw new Error('Invalid TRON address')

  const contractAddress = getContractAddress()
  const contract = await tronWeb.contract().at(contractAddress)

  const [trxBalanceSun, tokenBalanceRaw, decimals, symbol] = await Promise.all([
    tronWeb.trx.getBalance(address),
    contract.balanceOf(address).call(),
    contract.decimals().call(),
    contract.symbol().call(),
  ])

  const trxBalance = (trxBalanceSun / 1_000_000).toFixed(6)
  const dec = Number(decimals)
  const tokenBalance = (Number(tokenBalanceRaw) / Math.pow(10, dec)).toFixed(dec)

  return {
    address,
    trxBalance,
    tokenBalance,
    tokenSymbol: String(symbol),
    network: 'TRON_NILE',
    environment: 'TESTNET',
  }
}

export async function submitTransfer(
  privateKey: string,
  toAddress: string,
  amountUnits: bigint
): Promise<TronSubmitResult> {
  const tronWeb = getTronWeb(privateKey)
  if (!tronWeb.address.isAddress(toAddress)) throw new Error('Invalid destination TRON address')

  const fromAddress = tronWeb.address.fromPrivateKey(privateKey)
  const contractAddress = getContractAddress()
  const contract = await tronWeb.contract().at(contractAddress)

  // Verify balance before submitting
  const balance: bigint = await contract.balanceOf(fromAddress).call()
  if (balance < amountUnits) throw new Error('Insufficient testnet token balance')

  const txHash: string = await contract.transfer(toAddress, amountUnits).send()

  return {
    txHash,
    fromAddress,
    toAddress,
    amountUnits,
    network: 'TRON_NILE',
    status: 'PENDING',
    environment: 'TESTNET',
  }
}

export async function getTransactionReceipt(txHash: string): Promise<TronTxReceipt> {
  const tronWeb = getTronWeb()

  const [tx, txInfo] = await Promise.all([
    tronWeb.trx.getTransaction(txHash),
    tronWeb.trx.getTransactionInfo(txHash),
  ])

  if (!tx || !tx.txID) throw new Error('Transaction not found')

  const blockNumber = txInfo?.blockNumber ?? 0
  const confirmed = blockNumber > 0
  const contractRet = tx.ret?.[0]?.contractRet

  return {
    txHash,
    blockNumber,
    confirmations: confirmed ? 1 : 0,
    status: !confirmed ? 'PENDING' : contractRet === 'SUCCESS' ? 'CONFIRMED' : 'FAILED',
    fromAddress: '',
    toAddress: '',
    network: 'TRON_NILE',
    environment: 'TESTNET',
  }
}
