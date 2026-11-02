'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/services/api'
import { StatusBadge, EnvBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { useWalletSocket } from '@/hooks/useWalletSocket'

interface Wallet {
  id: string
  label: string
  status: string
  balanceDisplay: string
  address: string
}

interface Entry {
  id: string
  type: string
  amountDisplay: string
  balanceAfterDisplay: string
  description: string
  createdAt: string
}

type Action = 'deposit' | 'withdraw' | 'transfer' | null

export default function WalletDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<Action>((searchParams.get('action') as Action) ?? null)
  const [form, setForm] = useState({ amountDisplay: '', description: '', toWalletId: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const loadWallet = useCallback(() => {
    api.get<Wallet>(`/api/v1/wallets/${id}`).then(setWallet).catch(() => router.push('/dashboard/wallets'))
  }, [id, router])

  const loadHistory = useCallback(() => {
    api.get<{ items: Entry[]; total: number }>(`/api/v1/wallets/${id}/history?page=${page}&limit=20`)
      .then(d => { setEntries(d.items); setTotal(d.total) })
      .catch(() => {})
  }, [id, page])

  useEffect(() => { loadWallet(); loadHistory() }, [loadWallet, loadHistory])
  useWalletSocket(id, () => { loadWallet(); loadHistory() })

  async function handleAction(e: React.FormEvent) {
    e.preventDefault()
    if (!action) return
    setLoading(true)
    setMsg('')
    try {
      const endpoint = `/api/v1/wallets/${id}/${action}`
      const body = action === 'transfer'
        ? { amountDisplay: form.amountDisplay, description: form.description, toWalletId: form.toWalletId }
        : { amountDisplay: form.amountDisplay, description: form.description }

      await api.post(endpoint, body)
      setMsg(`${action.charAt(0).toUpperCase() + action.slice(1)} successful`)
      setForm({ amountDisplay: '', description: '', toWalletId: '' })
      loadWallet()
      loadHistory()
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  if (!wallet) return <div className="p-8 text-surface/40">Loading…</div>

  const actionColor: Record<string, string> = {
    deposit: 'text-primary',
    withdraw: 'text-danger',
    transfer: 'text-secondary',
  }

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => router.back()} className="text-sm text-surface/40 hover:text-surface mb-6">
        ← Back
      </button>

      {/* Wallet header */}
      <div className="bg-card rounded-xl border border-white/5 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-surface/40 mb-1">BlockCoin Virtual Wallet</p>
            <h2 className="text-xl font-bold">{wallet.label}</h2>
            <p className="text-xs font-mono text-surface/30 mt-1">{wallet.address}</p>
          </div>
          <div className="flex items-center gap-2">
            <EnvBadge env="INTERNAL" />
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              wallet.status === 'ACTIVE' ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'
            }`}>{wallet.status}</span>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-4xl font-bold font-mono text-primary">{wallet.balanceDisplay}</p>
          <p className="text-sm text-surface/40 mt-1">USDT — BlockCoin Internal Balance</p>
        </div>

        {wallet.status === 'ACTIVE' && (
          <div className="flex gap-3">
            {(['deposit', 'withdraw', 'transfer'] as const).map(a => (
              <button
                key={a}
                onClick={() => { setAction(a); setMsg('') }}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  action === a
                    ? 'bg-primary text-bg'
                    : 'bg-white/5 text-surface/60 hover:bg-white/10'
                }`}
              >
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action form */}
      {action && wallet.status === 'ACTIVE' && (
        <div className="bg-card rounded-xl border border-white/5 p-6 mb-6">
          <h3 className={`font-semibold mb-4 capitalize ${actionColor[action]}`}>{action}</h3>
          {msg && (
            <p className={`text-sm mb-4 p-3 rounded-lg ${
              msg.includes('successful') ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
            }`}>{msg}</p>
          )}
          <form onSubmit={handleAction} className="space-y-4">
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
            {action === 'transfer' && (
              <div>
                <label className="block text-sm text-surface/60 mb-1">Destination Wallet ID</label>
                <input
                  value={form.toWalletId}
                  onChange={e => setForm(f => ({ ...f, toWalletId: e.target.value }))}
                  placeholder="Wallet ID"
                  className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface font-mono focus:outline-none focus:border-primary"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-surface/60 mb-1">Description (optional)</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface focus:outline-none focus:border-primary"
                maxLength={200}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-bg font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
              >
                {loading ? 'Processing…' : `Confirm ${action}`}
              </button>
              <button
                type="button"
                onClick={() => { setAction(null); setMsg('') }}
                className="px-6 py-2.5 rounded-lg bg-white/5 text-surface/60 hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ledger history */}
      <div className="bg-card rounded-xl border border-white/5">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold">Transaction History</h3>
        </div>
        {entries.length === 0 ? (
          <p className="p-6 text-surface/40 text-sm">No transactions yet</p>
        ) : (
          <div className="divide-y divide-white/5">
            {entries.map(e => (
              <div key={e.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    e.type === 'CREDIT' || (e.type === 'TRANSFER' && e.description.startsWith('Transfer in'))
                      ? 'bg-primary/20 text-primary'
                      : 'bg-danger/20 text-danger'
                  }`}>
                    {e.type === 'CREDIT' ? '↓' : e.type === 'DEBIT' ? '↑' : '⇄'}
                  </span>
                  <div>
                    <p className="text-sm">{e.description}</p>
                    <p className="text-xs text-surface/40">{new Date(e.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm font-semibold ${
                    e.type === 'CREDIT' || e.description.startsWith('Transfer in')
                      ? 'text-primary' : 'text-danger'
                  }`}>
                    {e.type === 'CREDIT' || e.description.startsWith('Transfer in') ? '+' : '-'}
                    {e.amountDisplay}
                  </p>
                  <p className="text-xs text-surface/40 font-mono">bal: {e.balanceAfterDisplay}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} limit={20} total={total} onPage={setPage} />
      </div>
    </div>
  )
}
