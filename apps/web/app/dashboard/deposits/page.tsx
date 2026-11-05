'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/services/api'

interface Wallet { id: string; label: string; status: string }
interface DepositAddresses { ETH_ERC20: string; TRON_TRC20: string }
interface DepositRequest {
  id: string
  network: string
  txHash: string
  amountDisplay: string
  status: string
  adminNote: string | null
  createdAt: string
  wallet: { label: string }
}

const NETWORK_META: Record<string, { label: string; short: string; placeholder: string }> = {
  TRON_TRC20: { label: 'TRON (TRC-20 USDT)', short: 'USDT TRC20', placeholder: 'e.g. a1b2c3d4e5f6...' },
  ETH_ERC20:  { label: 'Ethereum (ERC-20 USDT)', short: 'USDT ERC20', placeholder: '0x1a2b3c4d...' },
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-warning/20 text-warning',
  APPROVED: 'bg-primary/20 text-primary',
  REJECTED: 'bg-danger/20 text-danger',
}

export default function DepositsPage() {
  const searchParams = useSearchParams()
  const [addresses, setAddresses] = useState<DepositAddresses | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [deposits, setDeposits] = useState<DepositRequest[]>([])
  const [form, setForm] = useState({
    walletId: searchParams.get('walletId') ?? '',
    network: 'TRON_TRC20',
    txHash: '',
    amountDisplay: '',
  })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const [addr, wals, deps] = await Promise.allSettled([
      api.get<DepositAddresses>('/api/v1/deposits/addresses'),
      api.get<Wallet[]>('/api/v1/wallets'),
      api.get<{ items: DepositRequest[] }>('/api/v1/deposits'),
    ])
    if (addr.status === 'fulfilled') setAddresses(addr.value)
    if (wals.status === 'fulfilled') setWallets(wals.value.filter(w => w.status === 'ACTIVE'))
    if (deps.status === 'fulfilled') setDeposits(deps.value.items)
  }, [])

  useEffect(() => { load() }, [load])

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      await api.post('/api/v1/deposits', form)
      setMsg('Deposit submitted! Awaiting admin approval.')
      setForm(f => ({ ...f, txHash: '', amountDisplay: '' }))
      load()
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const selectedAddress = addresses?.[form.network as keyof DepositAddresses]
  const meta = NETWORK_META[form.network]

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <h2 className="text-xl md:text-2xl font-bold mb-1">Deposit USDT</h2>
      <p className="text-surface/50 text-sm mb-6">Complete your payment below, then submit your transaction hash.</p>

      {/* Step 1 */}
      <div className="bg-card rounded-xl border border-white/5 p-6 mb-6">
        <p className="text-xs text-surface/40 uppercase tracking-wider mb-1">Step 1</p>
        <h3 className="font-semibold text-lg mb-4">Complete Your Payment</h3>

        {/* Network selector */}
        <div className="mb-5">
          <label className="block text-sm text-surface/60 mb-2">Network</label>
          <div className="flex gap-3">
            {(['TRON_TRC20', 'ETH_ERC20'] as const).map(net => (
              <button
                key={net}
                type="button"
                onClick={() => { setForm(f => ({ ...f, network: net })); setCopied(false) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  form.network === net ? 'bg-primary text-bg' : 'bg-white/5 text-surface/60 hover:bg-white/10'
                }`}
              >
                {NETWORK_META[net].short}
              </button>
            ))}
          </div>
          {selectedAddress && (
            <p className="text-sm text-surface/60 mt-3">
              Send exactly <span className="text-surface font-semibold">${form.amountDisplay || '—'}</span> via{' '}
              <span className="text-primary font-semibold">{meta.short}</span>
            </p>
          )}
        </div>

        {/* Address + QR */}
        {selectedAddress ? (
          <div className="bg-sidebar rounded-xl p-5">
            <p className="text-sm font-semibold mb-4">Send to this address</p>

            {/* QR Code */}
            <div className="flex flex-col items-center mb-5">
              <p className="text-xs text-surface/40 mb-3">{meta.short}</p>
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG
                  value={selectedAddress}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
              <p className="text-xs text-surface/40 mt-2">Scan QR to copy address</p>
            </div>

            {/* Wallet address */}
            <div>
              <p className="text-xs text-surface/40 mb-2">Wallet Address:</p>
              <div className="flex items-center gap-3 bg-bg/50 rounded-lg px-4 py-3 border border-white/5">
                <code className="text-sm font-mono text-primary break-all flex-1">{selectedAddress}</code>
                <button
                  type="button"
                  onClick={() => copy(selectedAddress)}
                  className="shrink-0 px-3 py-1.5 bg-primary/20 text-primary text-xs rounded-lg hover:bg-primary/30 transition font-medium"
                >
                  {copied ? '✓ Copied' : 'Copy Address'}
                </button>
              </div>
            </div>

            <p className="text-xs text-warning mt-4">
              ⚠ Only send USDT on the {form.network === 'TRON_TRC20' ? 'TRON' : 'Ethereum'} network to this address. Sending other tokens or using the wrong network may result in permanent loss.
            </p>
          </div>
        ) : (
          <div className="bg-sidebar rounded-xl p-5 text-center">
            <p className="text-surface/40 text-sm">Deposit address not configured. Contact support.</p>
          </div>
        )}
      </div>

      {/* Step 2 */}
      <div className="bg-card rounded-xl border border-white/5 p-6 mb-6">
        <p className="text-xs text-surface/40 uppercase tracking-wider mb-1">Step 2</p>
        <h3 className="font-semibold text-lg mb-4">Submit Your Transaction</h3>

        {msg && (
          <p className={`text-sm mb-4 p-3 rounded-lg ${
            msg.includes('submitted') ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
          }`}>{msg}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-surface/60 mb-1">Wallet to credit</label>
            <select
              value={form.walletId}
              onChange={e => setForm(f => ({ ...f, walletId: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface focus:outline-none focus:border-primary"
              required
            >
              <option value="">Select wallet…</option>
              {wallets.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-surface/60 mb-1">Amount (USDT)</label>
            <input
              value={form.amountDisplay}
              onChange={e => setForm(f => ({ ...f, amountDisplay: e.target.value }))}
              placeholder="0.000000"
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface font-mono focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-surface/60 mb-1">Transaction Hash (TxID)</label>
            <input
              value={form.txHash}
              onChange={e => setForm(f => ({ ...f, txHash: e.target.value }))}
              placeholder={meta.placeholder}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface font-mono text-sm focus:outline-none focus:border-primary"
              required
            />
            <p className="text-xs text-surface/40 mt-1.5">
              You can find the transaction hash in your wallet or exchange transaction history.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedAddress}
            className="w-full bg-primary text-bg font-semibold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {loading ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </form>
      </div>

      {/* Deposit history */}
      {deposits.length > 0 && (
        <div className="bg-card rounded-xl border border-white/5">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-semibold">My Deposit Requests</h3>
          </div>
          <div className="divide-y divide-white/5">
            {deposits.map(d => (
              <div key={d.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>{d.status}</span>
                      <span className="text-xs text-surface/40">{NETWORK_META[d.network]?.short ?? d.network}</span>
                    </div>
                    <p className="text-sm font-mono text-surface/60 truncate">{d.txHash}</p>
                    <p className="text-xs text-surface/40 mt-0.5">{d.wallet.label} · {new Date(d.createdAt).toLocaleString()}</p>
                    {d.adminNote && <p className="text-xs text-warning mt-1">Note: {d.adminNote}</p>}
                  </div>
                  <p className="font-mono font-semibold text-primary shrink-0">{d.amountDisplay} USDT</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
