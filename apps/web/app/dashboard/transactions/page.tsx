'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { StatusBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import Link from 'next/link'

interface Tx {
  id: string
  type: string
  amountDisplay: string
  status: string
  environment: string
  fromWalletId: string | null
  toWalletId: string | null
  createdAt: string
}

import { useUIFlags } from '@/hooks/useUIFlags'

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const flags = useUIFlags()

  const load = useCallback(() => {
    api.get<{ items: Tx[]; total: number }>(`/api/v1/transactions?page=${page}&limit=20`)
      .then(d => { setTxs(d.items); setTotal(d.total) })
      .catch(() => {})
  }, [page])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Transactions</h2>
      </div>

      <div className="bg-card rounded-xl border border-white/5">
        {txs.length === 0 ? (
          <p className="p-8 text-center text-surface/40">No transactions yet</p>
        ) : (
          <div className="divide-y divide-white/5">
            {txs.map(tx => (
              <Link
                key={tx.id}
                href={`/dashboard/transactions/${tx.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/2 transition"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${
                    tx.type === 'CREDIT' ? 'bg-primary/20 text-primary' :
                    tx.type === 'DEBIT' ? 'bg-danger/20 text-danger' :
                    'bg-secondary/20 text-secondary'
                  }`}>
                    {tx.type === 'CREDIT' ? '↓' : tx.type === 'DEBIT' ? '↑' : '⇄'}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{tx.type}</p>
                    <p className="text-xs text-surface/40 font-mono mt-0.5">{tx.id.slice(0, 16)}…</p>
                    <p className="text-xs text-surface/30">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <p className={`font-mono text-sm font-semibold ${
                    tx.type === 'CREDIT' ? 'text-primary' : 'text-danger'
                  }`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{tx.amountDisplay} USDT
                  </p>
                  <StatusBadge status={tx.status as any} />
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
