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

const FILTERS = ['All', 'COMPLETED', 'PENDING', 'PROCESSING', 'FAILED']

const TX_ICON = {
  CREDIT: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4" />
    </svg>
  ),
  DEBIT: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4m0 0l-4 4m4-4l4 4" />
    </svg>
  ),
  TRANSFER: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
}

const TX_LABEL: Record<string, string> = {
  CREDIT: 'Money Received',
  DEBIT: 'Money Sent',
  TRANSFER: 'Transfer',
}

function groupByDate(items: TxItem[]) {
  const groups: Record<string, TxItem[]> = {}
  items.forEach(item => {
    const d = new Date(item.createdAt)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    let label: string
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(item)
  })
  return groups
}

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
            id: t.id, kind: 'transaction' as const,
            type: t.type, amountDisplay: t.amountDisplay, status: t.status,
            description: sanitize(t.simulation?.description ?? null),
            walletLabel: null, createdAt: t.createdAt,
            detailPath: `/dashboard/transactions/${t.id}`,
          }))
        : []

      const sims: TxItem[] = simRes.status === 'fulfilled'
        ? simRes.value.items.map(s => ({
            id: s.id, kind: 'payment' as const,
            type: s.type, amountDisplay: s.amountDisplay, status: s.status,
            description: sanitize(s.description),
            walletLabel: s.wallet?.label ?? null, createdAt: s.createdAt,
            detailPath: `/dashboard/simulations/${s.id}`,
          }))
        : []

      const seen = new Set<string>()
      const merged = [...txs, ...sims]
        .filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20)

      setItems(merged)
      setTotal(
        (txRes.status === 'fulfilled' ? txRes.value.total : 0) +
        (simRes.status === 'fulfilled' ? simRes.value.total : 0)
      )
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { load() }, [load])

  const groups = groupByDate(items)

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-surface">Transactions</h1>
        <p className="text-surface/40 text-sm mt-0.5">All your wallet activity</p>
      </div>

      {/* Filter pills */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setStatus(f === 'All' ? '' : f); setPage(1) }}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 ${
                (f === 'All' ? status === '' : status === f)
                  ? 'bg-primary text-bg'
                  : 'bg-card text-surface/50 border border-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="bg-card rounded-2xl border border-white/5 overflow-hidden">
            <ShimmerRows rows={8} />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-2xl border border-white/5 p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-surface/30">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-surface/40 text-sm">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groups).map(([date, dateItems]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-surface/30 uppercase tracking-wider mb-2 px-1">{date}</p>
                <div className="bg-card rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
                  {dateItems.map(item => (
                    <Link
                      key={`${item.kind}:${item.id}`}
                      href={item.detailPath}
                      className="flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        item.type === 'CREDIT' ? 'bg-primary/15 text-primary' :
                        item.type === 'DEBIT'  ? 'bg-danger/15 text-danger' :
                        'bg-secondary/15 text-secondary'
                      }`}>
                        {TX_ICON[item.type as keyof typeof TX_ICON] ?? TX_ICON.TRANSFER}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface truncate">
                          {item.description || TX_LABEL[item.type] || item.type}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-surface/40">
                            {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <StatusBadge status={item.status as any} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold font-mono ${
                          item.type === 'CREDIT' ? 'text-primary' : 'text-danger'
                        }`}>
                          {item.type === 'CREDIT' ? '+' : '-'}{item.amountDisplay}
                        </p>
                        <p className="text-[10px] text-surface/30 mt-0.5">USDT</p>
                      </div>
                    </Link>
                  ))}
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
