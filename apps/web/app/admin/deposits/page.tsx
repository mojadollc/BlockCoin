'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'

interface DepositRequest {
  id: string
  network: string
  txHash: string
  amountDisplay: string
  status: string
  adminNote: string | null
  createdAt: string
  user: { email: string; firstName: string; lastName: string }
  wallet: { label: string; address: string }
}

const NETWORK_LABELS: Record<string, string> = {
  ETH_ERC20: 'ERC-20',
  TRON_TRC20: 'TRC-20',
}

const EXPLORER_URL: Record<string, (hash: string) => string> = {
  ETH_ERC20: h => `https://etherscan.io/tx/${h}`,
  TRON_TRC20: h => `https://tronscan.org/#/transaction/${h}`,
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-warning/20 text-warning',
  APPROVED: 'bg-primary/20 text-primary',
  REJECTED: 'bg-danger/20 text-danger',
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([])
  const [filter, setFilter] = useState('PENDING')
  const [total, setTotal] = useState(0)
  const [actionId, setActionId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')

  const load = useCallback(() => {
    api.get<{ items: DepositRequest[]; total: number }>(`/api/v1/admin/deposits?status=${filter}&limit=50`)
      .then(d => { setDeposits(d.items); setTotal(d.total) })
      .catch(() => {})
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setMsg('')
    try {
      await api.post(`/api/v1/admin/deposits/${id}/${action}`, { adminNote: note })
      setMsg(`Deposit ${action}d successfully`)
      setActionId(null)
      setNote('')
      load()
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Action failed')
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Deposit Requests</h2>
          <p className="text-surface/50 text-sm mt-1">{total} total</p>
        </div>
        <div className="flex gap-2">
          {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === s ? 'bg-primary text-bg' : 'bg-white/5 text-surface/60 hover:bg-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <p className={`text-sm mb-4 p-3 rounded-lg ${
          msg.includes('successfully') ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
        }`}>{msg}</p>
      )}

      {deposits.length === 0 ? (
        <div className="bg-card rounded-xl border border-white/5 p-12 text-center">
          <p className="text-surface/40">No {filter.toLowerCase()} deposits</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deposits.map(d => (
            <div key={d.id} className="bg-card rounded-xl border border-white/5 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>{d.status}</span>
                    <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-surface/60">{NETWORK_LABELS[d.network]}</span>
                  </div>
                  <p className="font-semibold">{d.user.firstName} {d.user.lastName}</p>
                  <p className="text-xs text-surface/40">{d.user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold font-mono text-primary">{d.amountDisplay} USDT</p>
                  <p className="text-xs text-surface/40">{new Date(d.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-sidebar rounded-lg p-3 mb-3">
                <p className="text-xs text-surface/40 mb-1">Wallet: {d.wallet.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-surface/60 truncate flex-1">TxHash: {d.txHash}</p>
                  <a
                    href={EXPLORER_URL[d.network]?.(d.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-primary hover:underline"
                  >
                    Verify ↗
                  </a>
                </div>
              </div>

              {d.adminNote && (
                <p className="text-xs text-warning mb-3">Note: {d.adminNote}</p>
              )}

              {d.status === 'PENDING' && (
                <>
                  {actionId === d.id ? (
                    <div className="space-y-2">
                      <input
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Admin note (optional)"
                        className="w-full bg-sidebar border border-white/10 rounded-lg px-3 py-2 text-sm text-surface focus:outline-none focus:border-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(d.id, 'approve')}
                          className="flex-1 bg-primary text-bg text-sm font-semibold py-2 rounded-lg hover:bg-primary/90 transition"
                        >
                          ✓ Approve & Credit
                        </button>
                        <button
                          onClick={() => handleAction(d.id, 'reject')}
                          className="flex-1 bg-danger/20 text-danger text-sm font-semibold py-2 rounded-lg hover:bg-danger/30 transition"
                        >
                          ✗ Reject
                        </button>
                        <button
                          onClick={() => { setActionId(null); setNote('') }}
                          className="px-4 py-2 bg-white/5 text-surface/60 text-sm rounded-lg hover:bg-white/10 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setActionId(d.id); setMsg('') }}
                      className="text-sm bg-white/5 hover:bg-white/10 text-surface/70 px-4 py-2 rounded-lg transition"
                    >
                      Review
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
