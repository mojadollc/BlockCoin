'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'

interface Log {
  id: string
  action: string
  targetType: string | null
  targetId: string | null
  createdAt: string
  actor: { email: string; firstName: string; lastName: string }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (action) params.set('action', action)
    api.get<{ items: Log[]; total: number }>(`/api/v1/admin/audit-logs?${params}`)
      .then(d => { setLogs(d.items); setTotal(d.total) })
      .catch(() => {})
  }, [page, action])

  useEffect(() => { load() }, [load])

  const columns = [
    { key: 'createdAt', header: 'Time', render: (l: Log) => new Date(l.createdAt).toLocaleString() },
    { key: 'actor', header: 'Actor', render: (l: Log) => l.actor.email },
    { key: 'action', header: 'Action', render: (l: Log) => (
      <span className="font-mono text-xs text-primary">{l.action}</span>
    )},
    { key: 'target', header: 'Target', render: (l: Log) =>
      l.targetType ? `${l.targetType}: ${l.targetId?.slice(0, 8)}…` : '—'
    },
  ]

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold mb-2">Audit Logs</h2>
      <p className="text-surface/50 text-sm mb-6">Immutable record of all administrative actions.</p>

      <div className="bg-card rounded-xl border border-white/5">
        <div className="p-4 border-b border-white/5">
          <input
            value={action}
            onChange={e => { setAction(e.target.value); setPage(1) }}
            placeholder="Filter by action…"
            className="bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-sm text-surface w-full max-w-sm focus:outline-none focus:border-primary"
          />
        </div>
        <Table columns={columns} data={logs} emptyMessage="No audit logs" />
        <Pagination page={page} limit={20} total={total} onPage={setPage} />
      </div>
    </div>
  )
}
