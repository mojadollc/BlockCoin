import TronWeb from 'tronweb'

function getTronWeb(): TronWeb {
  const fullHost = process.env.TRON_MAINNET_URL
  if (!fullHost) throw new Error('TRON_MAINNET_URL not configured')

  const headers: Record<string, string> = {}
  if (process.env.TRON_MAINNET_API_KEY) {
    headers['TRON-PRO-API-KEY'] = process.env.TRON_MAINNET_API_KEY
  }

  return new TronWeb({ fullHost, headers })
}

function getContractAddress(): string {
  const addr = process.env.TRON_MAINNET_USDT_CONTRACT
  if (!addr) throw new Error('TRON_MAINNET_USDT_CONTRACT not configured')
  return addr
}

export function getNetworkInfo() {
  return {
    network: 'TRON_MAINNET',
    fullHost: process.env.TRON_MAINNET_URL ?? '',
    contractAddress: getContractAddress(),
    environment: 'MAINNET',
    readOnly: true,
  }
}

export async function getTokenInfo() {
  const tronWeb = getTronWeb()
  const contractAddress = getContractAddress()
  const contract = await tronWeb.contract().at(contractAddress)

  const [symbol, name, decimals] = await Promise.all([
    contract.symbol().call(),
    contract.name().call(),
    contract.decimals().call(),
  ])

  return {
    symbol: String(symbol),
    name: String(name),
    decimals: Number(decimals),
    contractAddress,
    isVerified: true,
    environment: 'MAINNET',
    note: 'Read-only. Verify contract independently: https://tronscan.org/#/token20/' + contractAddress,
  }
}

export async function getWalletBalance(address: string) {
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

  const dec = Number(decimals)
  return {
    address,
    trxBalance: (trxBalanceSun / 1_000_000).toFixed(6),
    tokenBalance: (Number(tokenBalanceRaw) / Math.pow(10, dec)).toFixed(dec),
    tokenSymbol: String(symbol),
    network: 'TRON_MAINNET',
    environment: 'MAINNET',
    readOnly: true,
  }
}

export async function getTransactionReceipt(txHash: string) {
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
    status: !confirmed ? 'PENDING' as const : contractRet === 'SUCCESS' ? 'CONFIRMED' as const : 'FAILED' as const,
    fromAddress: '',
    toAddress: '',
    network: 'TRON_MAINNET',
    environment: 'MAINNET',
    explorerUrl: `https://tronscan.org/#/transaction/${txHash}`,
  }
}
