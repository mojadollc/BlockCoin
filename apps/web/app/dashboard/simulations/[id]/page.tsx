'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/services/api'
import { StatusBadge, EnvBadge } from '@/components/ui/Badge'

interface SimEvent {
  id: string
  fromStatus: string | null
  toStatus: string
  note: string | null
  createdAt: string
}

interface SimDetail {
  id: string
  type: string
  amountDisplay: string
  status: string
  description: string | null
  processingDelay: number
  expiresAt: string | null
  completedAt: string | null
  createdAt: string
  wallet: { label: string }
  template: { name: string } | null
  events: SimEvent[]
}

const STATUS_COLORS: Record<string, string> = {
  CREATED: 'bg-white/10 text-surface/60',
  PENDING: 'bg-warning/20 text-warning',
  PROCESSING: 'bg-secondary/20 text-secondary',
  COMPLETED: 'bg-primary/20 text-primary',
  FAILED: 'bg-danger/20 text-danger',
  EXPIRED: 'bg-white/10 text-surface/40',
  CANCELLED: 'bg-white/10 text-surface/40',
}

import { useUIFlags } from '@/hooks/useUIFlags'

export default function SimulationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [sim, setSim] = useState<SimDetail | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const flags = useUIFlags()

  const load = useCallback(() => {
    api.get<SimDetail>(`/api/v1/simulations/${id}`)
      .then(setSim)
      .catch(() => router.push('/dashboard/simulations'))
  }, [id, router])

  useEffect(() => {
    load()
    // Poll for status updates while active
    const interval = setInterval(() => {
      if (sim && ['CREATED', 'PENDING', 'PROCESSING'].includes(sim.status)) load()
    }, 3000)
    return () => clearInterval(interval)
  }, [load, sim?.status])

  async function handleCancel() {
    setCancelling(true)
    try {
      await api.post(`/api/v1/simulations/${id}/cancel`)
      load()
    } catch { }
    setCancelling(false)
  }

  if (!sim) return <div className="p-8 text-surface/40">Loading…</div>

  const isActive = ['CREATED', 'PENDING', 'PROCESSING'].includes(sim.status)

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => router.back()} className="text-sm text-surface/40 hover:text-surface mb-6">
        ← Back
      </button>

      {/* Header card */}
      <div className="bg-card rounded-xl border border-white/5 p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-surface/40 mb-1">Simulation</p>
            <p className="font-mono text-xs text-surface/50">{sim.id}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <EnvBadge env="INTERNAL" show={flags.show_env_badge} />
            <StatusBadge status={sim.status as any} />
          </div>
        </div>

        <div className="text-center py-4 border-y border-white/5 mb-4">
          <p className={`text-4xl font-bold font-mono ${sim.type === 'CREDIT' ? 'text-primary' : 'text-danger'}`}>
            {sim.type === 'CREDIT' ? '+' : '-'}{sim.amountDisplay}
          </p>
          <p className="text-surface/40 text-sm mt-1">USDT — BlockCoin Simulated</p>
        </div>

        <div className="space-y-2 text-sm">
          {[
            { label: 'Wallet', value: sim.wallet.label },
            { label: 'Type', value: sim.type },
            { label: 'Description', value: sim.description ?? '—' },
            { label: 'Processing Delay', value: `${sim.processingDelay}s` },
            { label: 'Template', value: sim.template?.name ?? '—' },
            { label: 'Expires At', value: sim.expiresAt ? new Date(sim.expiresAt).toLocaleString() : '—' },
            { label: 'Completed At', value: sim.completedAt ? new Date(sim.completedAt).toLocaleString() : '—' },
            { label: 'Created', value: new Date(sim.createdAt).toLocaleString() },
          ].map(row => (
            <div key={row.label} className="flex justify-between">
              <span className="text-surface/50">{row.label}</span>
              <span className="text-surface/80 text-xs">{row.value}</span>
            </div>
          ))}
        </div>

        {isActive && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-warning">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              Processing…
            </div>
            {['CREATED', 'PENDING'].includes(sim.status) && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="ml-auto text-sm px-4 py-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Cancel'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status timeline */}
      <div className="bg-card rounded-xl border border-white/5 p-6">
        <h3 className="font-semibold mb-4">Status Timeline</h3>
        <div className="relative">
          {sim.events.map((ev, i) => (
            <div key={ev.id} className="flex gap-4 mb-4 last:mb-0">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full mt-0.5 ${STATUS_COLORS[ev.toStatus]?.includes('primary') ? 'bg-primary' : STATUS_COLORS[ev.toStatus]?.includes('warning') ? 'bg-warning' : STATUS_COLORS[ev.toStatus]?.includes('danger') ? 'bg-danger' : 'bg-white/20'}`} />
                {i < sim.events.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2">
                  {ev.fromStatus && (
                    <>
                      <span className="text-xs text-surface/40">{ev.fromStatus}</span>
                      <span className="text-surface/30 text-xs">→</span>
                    </>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[ev.toStatus] ?? ''}`}>
                    {ev.toStatus}
                  </span>
                </div>
                {ev.note && <p className="text-xs text-surface/40 mt-0.5">{ev.note}</p>}
                <p className="text-xs text-surface/30 mt-0.5">{new Date(ev.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
