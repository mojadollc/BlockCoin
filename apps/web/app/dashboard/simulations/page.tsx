'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { StatusBadge, EnvBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'

interface Wallet { id: string; label: string; status: string }
interface Template { id: string; name: string; type: string; defaultDelay: number }
interface Simulation {
  id: string
  type: string
  amountDisplay: string
  status: string
  description: string | null
  createdAt: string
  expiresAt: string | null
  wallet: { label: string }
}

import { useUIFlags } from '@/hooks/useUIFlags'

export default function SimulationsPage() {
  const [sims, setSims] = useState<Simulation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [form, setForm] = useState({
    walletId: '', type: 'CREDIT', amountDisplay: '',
    description: '', processingDelay: 0, expiresInSeconds: '', templateId: '',
  })
  const [error, setError] = useState('')
  const flags = useUIFlags()

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (status) params.set('status', status)
    api.get<{ items: Simulation[]; total: number }>(`/api/v1/simulations?${params}`)
      .then(d => { setSims(d.items); setTotal(d.total) })
      .catch(() => {})
  }, [page, status])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get<Wallet[]>('/api/v1/wallets').then(w => setWallets(w.filter(x => x.status === 'ACTIVE'))).catch(() => {})
    api.get<Template[]>('/api/v1/admin/templates').catch(() => {})
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const body: Record<string, unknown> = {
        walletId: form.walletId,
        type: form.type,
        amountDisplay: form.amountDisplay,
        processingDelay: Number(form.processingDelay),
      }
      if (form.description) body.description = form.description
      if (form.expiresInSeconds) body.expiresInSeconds = Number(form.expiresInSeconds)
      if (form.templateId) body.templateId = form.templateId

      await api.post('/api/v1/simulations', body)
      setOpen(false)
      setForm({ walletId: '', type: 'CREDIT', amountDisplay: '', description: '', processingDelay: 0, expiresInSeconds: '', templateId: '' })
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function handleCancel(id: string) {
    await api.post(`/api/v1/simulations/${id}/cancel`).catch(() => {})
    load()
  }

  const STATUS_OPTIONS = ['', 'CREATED', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED']

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Simulations</h2>
          <p className="text-surface/50 text-sm mt-1">Run virtual transaction scenarios on your wallets</p>
        </div>
        <div className="flex items-center gap-3">
          <EnvBadge env="INTERNAL" show={flags.show_env_badge} />
          <button
            onClick={() => setOpen(true)}
            className="bg-primary text-bg text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition"
          >
            + New Simulation
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s || 'all'}
            onClick={() => { setStatus(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              status === s ? 'bg-primary text-bg' : 'bg-white/5 text-surface/60 hover:bg-white/10'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-white/5">
        {sims.length === 0 ? (
          <p className="p-8 text-center text-surface/40">No simulations yet</p>
        ) : (
          <div className="divide-y divide-white/5">
            {sims.map(sim => (
              <div key={sim.id} className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                    sim.type === 'CREDIT' ? 'bg-primary/20 text-primary' :
                    sim.type === 'DEBIT' ? 'bg-danger/20 text-danger' :
                    'bg-secondary/20 text-secondary'
                  }`}>
                    {sim.type === 'CREDIT' ? '↓' : sim.type === 'DEBIT' ? '↑' : '⇄'}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{sim.wallet.label}</p>
                      <StatusBadge status={sim.status as any} />
                    </div>
                    <p className="text-xs text-surface/40 mt-0.5">
                      {sim.description ?? sim.type} · {new Date(sim.createdAt).toLocaleString()}
                    </p>
                    {sim.expiresAt && (
                      <p className="text-xs text-warning mt-0.5">
                        Expires: {new Date(sim.expiresAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`font-mono text-sm font-semibold ${
                    sim.type === 'CREDIT' ? 'text-primary' : 'text-danger'
                  }`}>
                    {sim.type === 'CREDIT' ? '+' : '-'}{sim.amountDisplay} USDT
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/simulations/${sim.id}`} className="text-xs text-secondary hover:underline">
                      Details
                    </Link>
                    {['CREATED', 'PENDING'].includes(sim.status) && (
                      <button onClick={() => handleCancel(sim.id)} className="text-xs text-danger hover:underline">
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
      <Modal isOpen={open} onClose={() => setOpen(false)} title="New Simulation">
        {error && <p className="text-danger text-sm mb-4 bg-danger/10 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-surface/60 mb-1">Wallet</label>
            <select value={form.walletId} onChange={e => setForm(f => ({ ...f, walletId: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary" required>
              <option value="">Select wallet…</option>
              {wallets.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-surface/60 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary">
                <option value="CREDIT">CREDIT (incoming)</option>
                <option value="DEBIT">DEBIT (outgoing)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-surface/60 mb-1">Amount (USDT)</label>
              <input value={form.amountDisplay} onChange={e => setForm(f => ({ ...f, amountDisplay: e.target.value }))}
                placeholder="0.000000" className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface font-mono focus:outline-none focus:border-primary" required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-surface/60 mb-1">Description (optional)</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary" maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-surface/60 mb-1">Processing Delay (s)</label>
              <input type="number" min={0} max={3600} value={form.processingDelay}
                onChange={e => setForm(f => ({ ...f, processingDelay: Number(e.target.value) }))}
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm text-surface/60 mb-1">Expires In (s, optional)</label>
              <input type="number" min={1} value={form.expiresInSeconds}
                onChange={e => setForm(f => ({ ...f, expiresInSeconds: e.target.value }))}
                placeholder="e.g. 300"
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary" />
            </div>
          </div>
          {flags.show_simulation_notice && (
          <p className="text-xs text-warning bg-warning/10 p-2 rounded">
            ⚠ This is a simulated transaction. Status: CREATED → PENDING → PROCESSING → COMPLETED
          </p>
          )}
          <button type="submit" className="w-full bg-primary text-bg font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition">
            Start Simulation
          </button>
        </form>
      </Modal>
    </div>
  )
}
