'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { StatusBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'
import { ShimmerRows } from '@/components/ui/Shimmer'

interface Wallet { id: string; label: string; user: { email: string } }
interface Simulation {
  id: string
  type: string
  amountDisplay: string
  status: string
  description: string | null
  processingDelay: number
  expiresAt: string | null
  createdAt: string
  wallet: { label: string; user: { email: string } }
  createdBy: { email: string }
}

export default function AdminSimulationsPage() {
  const [sims, setSims] = useState<Simulation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [forceOpen, setForceOpen] = useState<string | null>(null)
  const [forceStatus, setForceStatus] = useState('COMPLETED')
  const [forceNote, setForceNote] = useState('')
  const [form, setForm] = useState({
    walletId: '', type: 'CREDIT', amountDisplay: '',
    description: '', processingDelay: 0, expiresInSeconds: '',
  })
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (statusFilter) params.set('status', statusFilter)
    setLoading(true)
    api.get<{ items: Simulation[]; total: number }>(`/api/v1/admin/simulations?${params}`)
      .then(d => { setSims(d.items); setTotal(d.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get<{ items: Wallet[] }>('/api/v1/admin/wallets?limit=100')
      .then(d => setWallets(d.items))
      .catch(() => {})
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const body: Record<string, unknown> = {
        walletId: form.walletId, type: form.type,
        amountDisplay: form.amountDisplay,
        processingDelay: Number(form.processingDelay),
      }
      if (form.description) body.description = form.description
      if (form.expiresInSeconds) body.expiresInSeconds = Number(form.expiresInSeconds)
      await api.post('/api/v1/admin/simulations', body)
      setCreateOpen(false)
      setForm({ walletId: '', type: 'CREDIT', amountDisplay: '', description: '', processingDelay: 0, expiresInSeconds: '' })
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function handleForce(e: React.FormEvent) {
    e.preventDefault()
    if (!forceOpen) return
    setMsg('')
    try {
      await api.post(`/api/v1/admin/simulations/${forceOpen}/force-status`, { status: forceStatus, note: forceNote })
      setMsg(`Status forced to ${forceStatus}`)
      setForceOpen(null)
      load()
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function handleCancel(id: string) {
    await api.post(`/api/v1/admin/simulations/${id}/cancel`).catch(() => {})
    load()
  }

  const STATUS_OPTIONS = ['', 'CREATED', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED']

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Transactions</h2>
        <button
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-bg text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          + Create Transaction
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_OPTIONS.map(s => (
          <button key={s || 'all'} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s ? 'bg-primary text-bg' : 'bg-white/5 text-surface/60 hover:bg-white/10'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-white/5">
        {loading ? <ShimmerRows rows={6} /> : sims.length === 0 ? (
          <p className="p-8 text-center text-surface/40">No transactions</p>
        ) : (
          <div className="divide-y divide-white/5">
            {sims.map(sim => (
              <div key={sim.id} className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${sim.type === 'CREDIT' ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>
                    {sim.type === 'CREDIT' ? '↓' : '↑'}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{sim.wallet.label}</p>
                      <span className="text-xs text-surface/40">({sim.wallet.user.email})</span>
                      <StatusBadge status={sim.status as any} />
                    </div>
                    <p className="text-xs text-surface/40 mt-0.5">
                      {sim.description ?? sim.type} · {new Date(sim.createdAt).toLocaleString()}
                      {sim.processingDelay > 0 && ` · delay: ${sim.processingDelay}s`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`font-mono text-sm font-semibold ${sim.type === 'CREDIT' ? 'text-primary' : 'text-danger'}`}>
                    {sim.type === 'CREDIT' ? '+' : '-'}{sim.amountDisplay} USDT
                  </p>
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => { setForceOpen(sim.id); setMsg('') }} className="text-secondary hover:underline">
                      Force Status
                    </button>
                    {!['COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED'].includes(sim.status) && (
                      <button onClick={() => handleCancel(sim.id)} className="text-danger hover:underline">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} limit={20} total={total} onPage={setPage} />
      </div>

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Transaction">
        {error && <p className="text-danger text-sm mb-4 bg-danger/10 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-surface/60 mb-1">Target Wallet</label>
            <select value={form.walletId} onChange={e => setForm(f => ({ ...f, walletId: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary" required>
              <option value="">Select wallet…</option>
              {wallets.map(w => <option key={w.id} value={w.id}>{w.label} ({w.user.email})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-surface/60 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary">
                <option value="CREDIT">CREDIT</option>
                <option value="DEBIT">DEBIT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-surface/60 mb-1">Amount (USDT)</label>
              <input value={form.amountDisplay} onChange={e => setForm(f => ({ ...f, amountDisplay: e.target.value }))}
                placeholder="0.000000" className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface font-mono focus:outline-none focus:border-primary" required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-surface/60 mb-1">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-surface/60 mb-1">Delay (s)</label>
              <input type="number" min={0} max={3600} value={form.processingDelay}
                onChange={e => setForm(f => ({ ...f, processingDelay: Number(e.target.value) }))}
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm text-surface/60 mb-1">Expires In (s)</label>
              <input type="number" min={1} value={form.expiresInSeconds}
                onChange={e => setForm(f => ({ ...f, expiresInSeconds: e.target.value }))}
                placeholder="optional"
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary" />
            </div>
          </div>
          <button type="submit" className="w-full bg-primary text-bg font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition">
            Create Transaction
          </button>
        </form>
      </Modal>

      {/* Force status modal */}
      <Modal isOpen={!!forceOpen} onClose={() => setForceOpen(null)} title="Force Transaction Status">
        {msg && <p className={`text-sm mb-4 p-3 rounded-lg ${msg.includes('forced') ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>{msg}</p>}
        <form onSubmit={handleForce} className="space-y-4">
          <div>
            <label className="block text-sm text-surface/60 mb-1">New Status</label>
            <select value={forceStatus} onChange={e => setForceStatus(e.target.value)}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary">
              {['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-surface/60 mb-1">Note</label>
            <input value={forceNote} onChange={e => setForceNote(e.target.value)}
              placeholder="Reason for override…"
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary" />
          </div>
          <p className="text-xs text-warning bg-warning/10 p-2 rounded">
            ⚠ Forcing COMPLETED will apply the ledger entry immediately. This is recorded in the audit log.
          </p>
          <button type="submit" className="w-full bg-warning text-bg font-semibold py-2.5 rounded-lg hover:bg-warning/90 transition">
            Force Status
          </button>
        </form>
      </Modal>
    </div>
  )
}
