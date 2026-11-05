'use client'
import { useEffect, useState, useCallback } from 'react'
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

const NETWORK_LABELS: Record<string, string> = {
  ETH_ERC20: 'Ethereum (ERC-20 USDT)',
  TRON_TRC20: 'TRON (TRC-20 USDT)',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-warning/20 text-warning',
  APPROVED: 'bg-primary/20 text-primary',
  REJECTED: 'bg-danger/20 text-danger',
}

export default function DepositsPage() {
  const [addresses, setAddresses] = useState<DepositAddresses | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [deposits, setDeposits] = useState<DepositRequest[]>([])
  const [form, setForm] = useState({ walletId: '', network: 'TRON_TRC20', txHash: '', amountDisplay: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

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

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
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

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <h2 className="text-xl md:text-2xl font-bold mb-1">Deposit USDT</h2>
      <p className="text-surface/50 text-sm mb-6">Send real USDT to our address, then submit your transaction hash for admin approval.</p>

      {/* Step 1 — Choose network & copy address */}
      <div className="bg-card rounded-xl border border-white/5 p-6 mb-6">
        <h3 className="font-semibold mb-4 text-surface/80">Step 1 — Send USDT to our address</h3>

        <div className="flex gap-3 mb-4">
          {(['TRON_TRC20', 'ETH_ERC20'] as const).map(net => (
            <button
              key={net}
              onClick={() => setForm(f => ({ ...f, network: net }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                form.network === net ? 'bg-primary text-bg' : 'bg-white/5 text-surface/60 hover:bg-white/10'
              }`}
            >
              {net === 'TRON_TRC20' ? 'TRON TRC-20' : 'Ethereum ERC-20'}
            </button>
          ))}
        </div>

        {selectedAddress ? (
          <div className="bg-sidebar rounded-lg p-4">
            <p className="text-xs text-surface/40 mb-2">Send USDT ({form.network === 'TRON_TRC20' ? 'TRC-20' : 'ERC-20'}) to:</p>
            <div className="flex items-center gap-3">
              <code className="text-sm font-mono text-primary break-all flex-1">{selectedAddress}</code>
              <button
                onClick={() => copy(selectedAddress, form.network)}
                className="shrink-0 px-3 py-1.5 bg-primary/20 text-primary text-xs rounded-lg hover:bg-primary/30 transition"
              >
                {copied === form.network ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-warning mt-3">⚠ Only send USDT on the {form.network === 'TRON_TRC20' ? 'TRON' : 'Ethereum'} network. Sending other tokens may result in permanent loss.</p>
          </div>
        ) : (
          <p className="text-surface/40 text-sm">Deposit address not configured. Contact support.</p>
        )}
      </div>

      {/* Step 2 — Submit tx hash */}
      <div className="bg-card rounded-xl border border-white/5 p-6 mb-6">
        <h3 className="font-semibold mb-4 text-surface/80">Step 2 — Submit your transaction</h3>

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
            <label className="block text-sm text-surface/60 mb-1">Network</label>
            <select
              value={form.network}
              onChange={e => setForm(f => ({ ...f, network: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface focus:outline-none focus:border-primary"
            >
              <option value="TRON_TRC20">TRON (TRC-20 USDT)</option>
              <option value="ETH_ERC20">Ethereum (ERC-20 USDT)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-surface/60 mb-1">Transaction Hash (TxID)</label>
            <input
              value={form.txHash}
              onChange={e => setForm(f => ({ ...f, txHash: e.target.value }))}
              placeholder={form.network === 'TRON_TRC20' ? 'e.g. a1b2c3d4e5f6...' : '0x1a2b3c4d...'}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface font-mono text-sm focus:outline-none focus:border-primary"
              required
            />
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
                      <span className="text-xs text-surface/40">{NETWORK_LABELS[d.network]}</span>
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
