'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/services/api'
import { EnvBadge } from '@/components/ui/Badge'
import { PasswordInput } from '@/components/ui/PasswordInput'

interface NetworkInfo {
  network: string
  chainId?: number
  name?: string
  fullHost?: string
  rpcUrl?: string
  contractAddress: string
  environment: 'TESTNET'
}

interface TokenInfo {
  symbol: string
  name: string
  decimals: number
  contractAddress: string
  isVerified: boolean
  note: string
}

interface WalletBalance {
  address: string
  ethBalance?: string
  trxBalance?: string
  tokenBalance: string
  tokenSymbol: string
  network: string
  environment: 'TESTNET'
}

interface ReceiptResult {
  txHash: string
  blockNumber: number
  confirmations: number
  status: string
  fromAddress: string
  toAddress: string
  network: string
  environment: 'TESTNET'
}

const NET_META: Record<string, { label: string; icon: string; color: string; nativeCoin: string; explorer: string; addressPlaceholder: string }> = {
  sepolia: {
    label: 'Ethereum Sepolia',
    icon: '⟠',
    color: 'text-secondary',
    nativeCoin: 'ETH',
    explorer: 'https://sepolia.etherscan.io/tx/',
    addressPlaceholder: '0x…',
  },
  'tron-nile': {
    label: 'TRON Nile',
    icon: '◈',
    color: 'text-warning',
    nativeCoin: 'TRX',
    explorer: 'https://nile.tronscan.org/#/transaction/',
    addressPlaceholder: 'T…',
  },
}

export default function NetworkPage() {
  const { network } = useParams<{ network: string }>()
  const router = useRouter()
  const meta = NET_META[network]

  const [netInfo, setNetInfo] = useState<NetworkInfo | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [balanceAddress, setBalanceAddress] = useState('')
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [balanceError, setBalanceError] = useState('')

  const [sendForm, setSendForm] = useState({ privateKey: '', toAddress: '', amountDisplay: '' })
  const [sendResult, setSendResult] = useState<{ txHash: string; note: string } | null>(null)
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError, setSendError] = useState('')

  const [verifyHash, setVerifyHash] = useState('')
  const [receipt, setReceipt] = useState<ReceiptResult | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState('')

  useEffect(() => {
    if (!meta) { router.push('/dashboard/testnet'); return }
    Promise.all([
      api.get<NetworkInfo>(`/api/v1/testnet/${network}/info`),
      api.get<TokenInfo>(`/api/v1/testnet/${network}/token`),
    ]).then(([n, t]) => { setNetInfo(n); setTokenInfo(t) }).catch(() => {})
  }, [network, meta, router])

  async function handleBalance(e: React.FormEvent) {
    e.preventDefault()
    setBalanceLoading(true)
    setBalanceError('')
    setBalance(null)
    try {
      const b = await api.get<WalletBalance>(`/api/v1/testnet/${network}/balance?address=${encodeURIComponent(balanceAddress)}`)
      setBalance(b)
    } catch (err: unknown) {
      setBalanceError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBalanceLoading(false)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setSendLoading(true)
    setSendError('')
    setSendResult(null)
    try {
      const result = await api.post<{ txHash: string; note: string }>(`/api/v1/testnet/${network}/send`, sendForm)
      setSendResult(result)
      setSendForm(f => ({ ...f, privateKey: '', amountDisplay: '' }))
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Transaction failed')
    } finally {
      setSendLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setVerifyLoading(true)
    setVerifyError('')
    setReceipt(null)
    try {
      const r = await api.get<ReceiptResult>(`/api/v1/testnet/${network}/receipt/${verifyHash}`)
      setReceipt(r)
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : 'Failed to fetch receipt')
    } finally {
      setVerifyLoading(false)
    }
  }

  if (!meta) return null

  return (
    <div className="p-8 max-w-3xl">
      <button onClick={() => router.back()} className="text-sm text-surface/40 hover:text-surface mb-6">← Back</button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className={`text-3xl ${meta.color}`}>{meta.icon}</span>
          <div>
            <h2 className="text-xl font-bold">{meta.label}</h2>
            <EnvBadge env="TESTNET" />
          </div>
        </div>
      </div>

      {/* Network + token info */}
      {netInfo && tokenInfo && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-white/5 p-4">
            <p className="text-xs text-surface/50 mb-2">Network</p>
            {netInfo.chainId && <p className="text-sm"><span className="text-surface/50">Chain ID:</span> {netInfo.chainId}</p>}
            {netInfo.name && <p className="text-sm"><span className="text-surface/50">Name:</span> {netInfo.name}</p>}
            {netInfo.fullHost && <p className="text-sm font-mono text-xs text-surface/40 truncate">{netInfo.fullHost}</p>}
          </div>
          <div className="bg-card rounded-xl border border-white/5 p-4">
            <p className="text-xs text-surface/50 mb-2">Token Contract</p>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold">{tokenInfo.symbol}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded ${tokenInfo.isVerified ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>
                {tokenInfo.isVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <p className="text-xs text-surface/40 font-mono break-all">{tokenInfo.contractAddress}</p>
            <p className="text-xs text-warning mt-2">{tokenInfo.note}</p>
          </div>
        </div>
      )}

      {/* Balance check */}
      <div className="bg-card rounded-xl border border-white/5 p-6 mb-4">
        <h3 className="font-semibold mb-4">Check Testnet Balance</h3>
        <form onSubmit={handleBalance} className="flex gap-3">
          <input
            value={balanceAddress}
            onChange={e => setBalanceAddress(e.target.value)}
            placeholder={meta.addressPlaceholder}
            className="flex-1 bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-sm text-surface font-mono focus:outline-none focus:border-primary"
            required
          />
          <button type="submit" disabled={balanceLoading}
            className="bg-secondary text-bg font-semibold px-5 py-2 rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition text-sm">
            {balanceLoading ? '…' : 'Check'}
          </button>
        </form>
        {balanceError && <p className="text-danger text-sm mt-3">{balanceError}</p>}
        {balance && (
          <div className="mt-4 p-4 bg-secondary/5 border border-secondary/20 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-surface/50">{meta.nativeCoin} Balance</span>
              <span className="font-mono">{balance.ethBalance ?? balance.trxBalance} {meta.nativeCoin}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface/50">{balance.tokenSymbol} Balance</span>
              <span className="font-mono font-semibold text-secondary">{balance.tokenBalance} {balance.tokenSymbol}</span>
            </div>
            <p className="text-xs text-surface/30 pt-1 border-t border-white/5">
              ⛓ TESTNET ENVIRONMENT — Real testnet balance, no monetary value
            </p>
          </div>
        )}
      </div>

      {/* Send transaction */}
      <div className="bg-card rounded-xl border border-white/5 p-6 mb-4">
        <h3 className="font-semibold mb-1">Send Testnet Transaction</h3>
        <p className="text-xs text-surface/40 mb-4">
          Private key is used only to sign the transaction and is never stored.
        </p>
        {sendResult ? (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-semibold text-primary mb-2">Transaction Submitted ✓</p>
            <p className="text-xs text-surface/50 mb-1">Transaction Hash:</p>
            <p className="font-mono text-xs break-all text-surface/80 mb-3">{sendResult.txHash}</p>
            <a
              href={`${meta.explorer}${sendResult.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-secondary hover:underline"
            >
              Verify on blockchain explorer ↗
            </a>
            <p className="text-xs text-warning mt-3">{sendResult.note}</p>
            <button onClick={() => setSendResult(null)} className="mt-3 text-xs text-surface/40 hover:text-surface">
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm text-surface/60 mb-1">Private Key (not stored)</label>
              <PasswordInput
                value={sendForm.privateKey}
                onChange={e => setSendForm(f => ({ ...f, privateKey: e.target.value }))}
                placeholder="Your testnet wallet private key"
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-sm text-surface font-mono focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-surface/60 mb-1">Destination Address</label>
              <input
                value={sendForm.toAddress}
                onChange={e => setSendForm(f => ({ ...f, toAddress: e.target.value }))}
                placeholder={meta.addressPlaceholder}
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-sm text-surface font-mono focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-surface/60 mb-1">Amount (USDT)</label>
              <input
                value={sendForm.amountDisplay}
                onChange={e => setSendForm(f => ({ ...f, amountDisplay: e.target.value }))}
                placeholder="0.000000"
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-sm text-surface font-mono focus:outline-none focus:border-primary"
                required
              />
            </div>
            {sendError && <p className="text-danger text-sm bg-danger/10 p-3 rounded-lg">{sendError}</p>}
            <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-lg">
              <p className="text-xs text-secondary font-semibold">⛓ TESTNET ENVIRONMENT</p>
              <p className="text-xs text-surface/50 mt-1">
                This submits a real transaction to the {meta.label} testnet. The transaction hash can be independently verified on a public blockchain explorer.
              </p>
            </div>
            <button type="submit" disabled={sendLoading}
              className="w-full bg-secondary text-bg font-semibold py-2.5 rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition">
              {sendLoading ? 'Submitting…' : 'Submit Testnet Transaction'}
            </button>
          </form>
        )}
      </div>

      {/* Verify receipt */}
      <div className="bg-card rounded-xl border border-white/5 p-6">
        <h3 className="font-semibold mb-4">Verify Transaction</h3>
        <form onSubmit={handleVerify} className="flex gap-3 mb-4">
          <input
            value={verifyHash}
            onChange={e => setVerifyHash(e.target.value)}
            placeholder="Transaction hash"
            className="flex-1 bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-sm text-surface font-mono focus:outline-none focus:border-primary"
            required
          />
          <button type="submit" disabled={verifyLoading}
            className="bg-primary text-bg font-semibold px-5 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition text-sm">
            {verifyLoading ? '…' : 'Verify'}
          </button>
        </form>
        {verifyError && <p className="text-danger text-sm">{verifyError}</p>}
        {receipt && (
          <div className="p-4 bg-card border border-white/10 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-surface/50">Status</span>
              <span className={`font-semibold ${receipt.status === 'CONFIRMED' ? 'text-primary' : receipt.status === 'FAILED' ? 'text-danger' : 'text-warning'}`}>
                {receipt.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface/50">Block Number</span>
              <span className="font-mono">{receipt.blockNumber || 'Pending'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface/50">Confirmations</span>
              <span className="font-mono">{receipt.confirmations}</span>
            </div>
            {receipt.fromAddress && (
              <div className="flex justify-between">
                <span className="text-surface/50">From</span>
                <span className="font-mono text-xs">{receipt.fromAddress.slice(0, 12)}…</span>
              </div>
            )}
            <div className="pt-2 border-t border-white/5">
              <a href={`${meta.explorer}${receipt.txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-secondary hover:underline">
                View on blockchain explorer ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
