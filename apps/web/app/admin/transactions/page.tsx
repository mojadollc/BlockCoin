'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge, EnvBadge } from '@/components/ui/Badge'
import { unitsToDisplay } from '@blockcoin/shared'

interface Tx {
  id: string
  environment: string
  type: string
  amountUnits: string
  status: string
  createdAt: string
}

export default function AdminTransactionsPage() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [env, setEnv] = useState('')

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (env) params.set('environment', env)
    api.get<{ items: Tx[]; total: number }>(`/api/v1/admin/transactions?${params}`)
      .then(d => { setTxs(d.items); setTotal(d.total) })
      .catch(() => {})
  }, [page, env])

  useEffect(() => { load() }, [load])

  const columns = [
    { key: 'id', header: 'ID', render: (t: Tx) => <span className="font-mono text-xs">{t.id.slice(0, 12)}…</span> },
    { key: 'environment', header: 'Env', render: (t: Tx) => <EnvBadge env={t.environment as any} /> },
    { key: 'type', header: 'Type' },
    { key: 'amount', header: 'Amount', render: (t: Tx) => (
      <span className="font-mono text-primary">{unitsToDisplay(BigInt(t.amountUnits))} USDT</span>
    )},
    { key: 'status', header: 'Status', render: (t: Tx) => <StatusBadge status={t.status as any} /> },
    { key: 'createdAt', header: 'Date', render: (t: Tx) => new Date(t.createdAt).toLocaleString() },
  ]

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Transactions</h2>

      <div className="bg-card rounded-xl border border-white/5">
        <div className="p-4 border-b border-white/5 flex gap-3">
          <select
            value={env}
            onChange={e => { setEnv(e.target.value); setPage(1) }}
            className="bg-sidebar border border-white/10 rounded-lg px-3 py-2 text-sm text-surface focus:outline-none focus:border-primary"
          >
            <option value="">All Environments</option>
            <option value="INTERNAL">INTERNAL</option>
            <option value="TESTNET">TESTNET</option>
          </select>
        </div>
        <Table columns={columns} data={txs} emptyMessage="No transactions" />
        <Pagination page={page} limit={20} total={total} onPage={setPage} />
      </div>
    </div>
  )
}
