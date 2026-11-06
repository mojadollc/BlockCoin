'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/services/api'
import { usePermission } from '@/hooks/usePermission'

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
  PENDING:  'bg-warning/20 text-warning',
  APPROVED: 'bg-primary/20 text-primary',
  REJECTED: 'bg-danger/20 text-danger',
}

const STATUS_ICONS: Record<string, string> = {
  PENDING:  '🕐',
  APPROVED: '✅',
  REJECTED: '❌',
}

export default function AdminDepositsPage() {
  const { canWrite } = usePermission('deposits')
  const [deposits, setDeposits]     = useState<DepositRequest[]>([])
  const [filter, setFilter]         = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [counts, setCounts]         = useState<Record<string, number>>({ PENDING: 0, APPROVED: 0, REJECTED: 0 })
  const [loadError, setLoadError]   = useState('')
  const [actionId, setActionId]     = useState<string | null>(null)
  const [notes, setNotes]           = useState<Record<string, string>>({})
  const [actionMsg, setActionMsg]   = useState<Record<string, { ok: boolean; text: string }>>({})
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoadError('')
    try {
      // Load current filter + always refresh pending count
      const [filtered, pending] = await Promise.all([
        api.get<{ items: DepositRequest[]; total: number }>(
          `/api/v1/admin/deposits?status=${filter}&limit=50`
        ),
        filter !== 'PENDING'
          ? api.get<{ total: number }>('/api/v1/admin/deposits?status=PENDING&limit=1')
          : Promise.resolve(null),
      ])
      setDeposits(filtered.items)
      setCounts(prev => ({
        ...prev,
        [filter]: filtered.total,
        ...(pending ? { PENDING: pending.total } : { PENDING: filtered.total }),
      }))
    } catch {
      if (!silent) setLoadError('Failed to load deposits. Check your connection or permissions.')
    }
  }, [filter])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(() => load(true), 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [load])

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setActionLoading(prev => ({ ...prev, [id]: true }))
    setActionMsg(prev => ({ ...prev, [id]: { ok: false, text: '' } }))
    try {
      await api.post(`/api/v1/admin/deposits/${id}/${action}`, { adminNote: notes[id] ?? '' })
      setActionMsg(prev => ({
        ...prev,
        [id]: { ok: true, text: action === 'approve' ? '✅ Approved — balance credited' : '❌ Deposit rejected' },
      }))
      setActionId(null)
      setNotes(prev => { const n = { ...prev }; delete n[id]; return n })
      // Refresh after short delay so the success message is visible
      setTimeout(() => load(), 800)
    } catch (err: unknown) {
      setActionMsg(prev => ({
        ...prev,
        [id]: { ok: false, text: err instanceof Error ? err.message : 'Action failed' },
      }))
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const tabs = (['PENDING', 'APPROVED', 'REJECTED'] as const)

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold">Deposit Requests</h2>
          <p className="text-surface/50 text-sm mt-1">
            Review and approve customer USDT deposits
          </p>
        </div>
        <button
          onClick={() => load()}
          className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-surface/60 rounded-lg transition"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Tabs with counts */}
      <div className="flex gap-2 mb-6">
        {tabs.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === s ? 'bg-primary text-bg' : 'bg-white/5 text-surface/60 hover:bg-white/10'
            }`}
          >
            {STATUS_ICONS[s]} {s}
            {counts[s] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                filter === s
                  ? 'bg-bg/20 text-bg'
                  : s === 'PENDING' ? 'bg-warning/20 text-warning' : 'bg-white/10 text-surface/50'
              }`}>
                {counts[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Load error */}
      {loadError && (
        <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl p-4 mb-4 flex items-center gap-3">
          <span>⚠️</span>
          <span>{loadError}</span>
          <button onClick={() => load()} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!loadError && deposits.length === 0 && (
        <div className="bg-card rounded-xl border border-white/5 p-16 text-center">
          <p className="text-4xl mb-3">{filter === 'PENDING' ? '🎉' : '📭'}</p>
          <p className="text-surface/50 font-medium">
            {filter === 'PENDING' ? 'No pending deposits — all caught up!' : `No ${filter.toLowerCase()} deposits`}
          </p>
        </div>
      )}

      {/* Deposit cards */}
      <div className="space-y-4">
        {deposits.map(d => {
          const msg = actionMsg[d.id]
          const isLoading = actionLoading[d.id]
          const isOpen = actionId === d.id

          return (
            <div key={d.id} className="bg-card rounded-xl border border-white/5 overflow-hidden">
              {/* Card header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status]}`}>
                        {STATUS_ICONS[d.status]} {d.status}
                      </span>
                      <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-surface/60">
                        {NETWORK_LABELS[d.network] ?? d.network}
                      </span>
                    </div>
                    <p className="font-semibold">{d.user.firstName} {d.user.lastName}</p>
                    <p className="text-xs text-surface/40">{d.user.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold font-mono text-primary">${d.amountDisplay}</p>
                    <p className="text-xs text-surface/40">USDT</p>
                    <p className="text-xs text-surface/30 mt-1">{new Date(d.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Wallet + TxHash row */}
                <div className="bg-sidebar rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-surface/40">Wallet</span>
                    <span className="text-xs text-surface/70 font-medium">{d.wallet.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-surface/40 shrink-0">TxHash</span>
                    <code className="text-xs font-mono text-surface/60 truncate flex-1">{d.txHash}</code>
                    <a
                      href={EXPLORER_URL[d.network]?.(d.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition font-medium"
                    >
                      Verify ↗
                    </a>
                  </div>
                </div>

                {/* Existing admin note (approved/rejected) */}
                {d.adminNote && (
                  <p className="text-xs text-warning mt-3 bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">
                    📝 Admin note: {d.adminNote}
                  </p>
                )}

                {/* Per-card action message */}
                {msg?.text && (
                  <p className={`text-sm mt-3 p-3 rounded-lg ${
                    msg.ok ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
                  }`}>{msg.text}</p>
                )}
              </div>

              {/* Action panel — PENDING only */}
              {d.status === 'PENDING' && canWrite && (
                <div className="border-t border-white/5 px-5 py-4 bg-sidebar/50">
                  {!isOpen ? (
                    <button
                      onClick={() => { setActionId(d.id); setActionMsg(prev => ({ ...prev, [d.id]: { ok: false, text: '' } })) }}
                      className="text-sm bg-primary/10 hover:bg-primary/20 text-primary px-5 py-2 rounded-lg transition font-medium"
                    >
                      Review Deposit →
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-surface/50 mb-1">Admin note (optional — shown to customer)</label>
                        <input
                          value={notes[d.id] ?? ''}
                          onChange={e => setNotes(prev => ({ ...prev, [d.id]: e.target.value }))}
                          placeholder="e.g. Verified on Tronscan, tx confirmed"
                          className="w-full bg-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(d.id, 'approve')}
                          disabled={isLoading}
                          className="flex-1 bg-primary text-bg text-sm font-bold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
                        >
                          {isLoading ? 'Processing…' : '✓ Approve & Credit Balance'}
                        </button>
                        <button
                          onClick={() => handleAction(d.id, 'reject')}
                          disabled={isLoading}
                          className="flex-1 bg-danger/20 text-danger text-sm font-semibold py-2.5 rounded-lg hover:bg-danger/30 disabled:opacity-50 transition"
                        >
                          ✗ Reject
                        </button>
                        <button
                          onClick={() => { setActionId(null); setNotes(prev => { const n = { ...prev }; delete n[d.id]; return n }) }}
                          disabled={isLoading}
                          className="px-4 py-2 bg-white/5 text-surface/50 text-sm rounded-lg hover:bg-white/10 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
