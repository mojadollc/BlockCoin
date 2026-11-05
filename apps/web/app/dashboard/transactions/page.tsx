'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { StatusBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { ShimmerRows } from '@/components/ui/Shimmer'
import Link from 'next/link'

interface TxItem {
  id: string
  kind: 'transaction' | 'payment'
  type: string
  amountDisplay: string
  status: string
  description: string | null
  walletLabel: string | null
  createdAt: string
  detailPath: string
}

function sanitize(text: string | null): string {
  if (!text) return ''
  return text
    .replace(/\[Security Test\]\s*/gi, '')
    .replace(/\bsimulat(ion|ed|ing|or)\b/gi, '')
    .replace(/\bscenario\b/gi, '')
    .replace(/Security test forced failure/gi, 'Failure')
    .replace(/\s{2,}/g, ' ').trim()
}

const STATUS_OPTIONS = ['', 'COMPLETED', 'PENDING', 'PROCESSING', 'FAILED', 'CANCELLED', 'EXPIRED']

export default function TransactionsPage() {
  const [items, setItems] = useState<TxItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) params.set('status', status)

      const [txRes, simRes] = await Promise.allSettled([
        api.get<{ items: any[]; total: number }>(`/api/v1/transactions?${params}`),
        api.get<{ items: any[]; total: number }>(`/api/v1/simulations?${params}`),
      ])

      const txs: TxItem[] = txRes.status === 'fulfilled'
        ? txRes.value.items.map(t => ({
            id: t.id,
            kind: 'transaction' as const,
            type: t.type,
            amountDisplay: t.amountDisplay,
            status: t.status,
            description: sanitize(t.simulation?.description ?? null),
            walletLabel: null,
            createdAt: t.createdAt,
            detailPath: `/dashboard/transactions/${t.id}`,
          }))
        : []

      const sims: TxItem[] = simRes.status === 'fulfilled'
        ? simRes.value.items.map(s => ({
            id: s.id,
            kind: 'payment' as const,
            type: s.type,
            amountDisplay: s.amountDisplay,
            status: s.status,
            description: sanitize(s.description),
            walletLabel: s.wallet?.label ?? null,
            createdAt: s.createdAt,
            detailPath: `/dashboard/simulations/${s.id}`,
          }))
        : []

      // Merge and deduplicate by id, sort by date desc
      const seen = new Set<string>()
      const merged = [...txs, ...sims]
        .filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20)

      const combinedTotal = (txRes.status === 'fulfilled' ? txRes.value.total : 0) +
                            (simRes.status === 'fulfilled' ? simRes.value.total : 0)

      setItems(merged)
      setTotal(combinedTotal)
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Transactions</h2>
        <p className="text-surface/50 text-sm mt-1">All your wallet activity in one place</p>
      </div>

      {/* Status filter */}
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
        {loading ? <ShimmerRows rows={8} /> : items.length === 0 ? (
          <p className="p-8 text-center text-surface/40">No transactions yet</p>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map(item => (
              <Link
                key={`${item.kind}:${item.id}`}
                href={item.detailPath}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-white/2 transition"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${
                    item.type === 'CREDIT' ? 'bg-primary/20 text-primary' :
                    item.type === 'DEBIT'  ? 'bg-danger/20 text-danger' :
                    'bg-secondary/20 text-secondary'
                  }`}>
                    {item.type === 'CREDIT' ? '↓' : item.type === 'DEBIT' ? '↑' : '⇄'}
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {item.description || (item.walletLabel ?? item.type)}
                    </p>
                    <p className="text-xs text-surface/40 mt-0.5">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                  <p className={`font-mono text-sm font-semibold ${
                    item.type === 'CREDIT' ? 'text-primary' : 'text-danger'
                  }`}>
                    {item.type === 'CREDIT' ? '+' : '-'}{item.amountDisplay} USDT
                  </p>
                  <StatusBadge status={item.status as any} />
                </div>
              </Link>
            ))}
          </div>
        )}
        <Pagination page={page} limit={20} total={total} onPage={setPage} />
      </div>
    </div>
  )
}
