'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/services/api'
import { StatusBadge, EnvBadge } from '@/components/ui/Badge'

interface TxDetail {
  id: string
  type: string
  amountDisplay: string
  status: string
  environment: string
  fromWalletId: string | null
  toWalletId: string | null
  idempotencyKey: string
  createdAt: string
  updatedAt: string
  simulation: {
    id: string
    description: string | null
    events: Array<{ id: string; fromStatus: string | null; toStatus: string; createdAt: string; note: string | null }>
  } | null
}

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tx, setTx] = useState<TxDetail | null>(null)

  useEffect(() => {
    api.get<TxDetail>(`/api/v1/transactions/${id}`)
      .then(setTx)
      .catch(() => router.push('/dashboard/transactions'))
  }, [id, router])

  if (!tx) return <div className="p-8 text-surface/40">Loading…</div>

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => router.back()} className="text-sm text-surface/40 hover:text-surface mb-6">
        ← Back
      </button>

      <div className="bg-card rounded-xl border border-white/5 p-6 mb-4">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-surface/40 mb-1">Transaction</p>
            <p className="font-mono text-xs text-surface/50 break-all">{tx.id}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <EnvBadge env={tx.environment as any} />
            <StatusBadge status={tx.status as any} />
          </div>
        </div>

        <div className="text-center py-4 border-y border-white/5 mb-6">
          <p className={`text-4xl font-bold font-mono ${
            tx.type === 'CREDIT' ? 'text-primary' : 'text-danger'
          }`}>
            {tx.type === 'CREDIT' ? '+' : '-'}{tx.amountDisplay}
          </p>
          <p className="text-surface/40 text-sm mt-1">USDT — BlockCoin Internal</p>
        </div>

        <div className="space-y-3 text-sm">
          {[
            { label: 'Type', value: tx.type },
            { label: 'Status', value: tx.status },
            { label: 'Environment', value: tx.environment },
            { label: 'From Wallet', value: tx.fromWalletId ?? '—' },
            { label: 'To Wallet', value: tx.toWalletId ?? '—' },
            { label: 'Created', value: new Date(tx.createdAt).toLocaleString() },
            { label: 'Updated', value: new Date(tx.updatedAt).toLocaleString() },
          ].map(row => (
            <div key={row.label} className="flex justify-between">
              <span className="text-surface/50">{row.label}</span>
              <span className="font-mono text-xs text-surface/80 max-w-xs truncate text-right">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-warning/5 border border-warning/20 rounded-lg">
          <p className="text-xs text-warning">
            ⚠ This is a BlockCoin internal virtual transaction. It is not a real blockchain transaction and cannot be verified on any blockchain explorer.
          </p>
        </div>
      </div>

      {/* Simulation events */}
      {tx.simulation && (
        <div className="bg-card rounded-xl border border-white/5 p-6">
          <h3 className="font-semibold mb-4">Simulation Status History</h3>
          {tx.simulation.description && (
            <p className="text-sm text-surface/60 mb-4">{tx.simulation.description}</p>
          )}
          <div className="space-y-2">
            {tx.simulation.events.map((ev, i) => (
              <div key={ev.id} className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                  {i + 1}
                </span>
                <span className="text-surface/40">{ev.fromStatus ?? 'START'}</span>
                <span className="text-surface/30">→</span>
                <span className="text-primary font-medium">{ev.toStatus}</span>
                <span className="text-surface/30 text-xs ml-auto">
                  {new Date(ev.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
