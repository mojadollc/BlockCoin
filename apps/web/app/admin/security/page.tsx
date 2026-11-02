'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import Link from 'next/link'

interface Report {
  id: string
  scenario: string
  expected: string
  actual: string
  passed: boolean
  createdAt: string
}

export default function SecurityPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [passedFilter, setPassedFilter] = useState('')

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (passedFilter) params.set('passed', passedFilter)
    api.get<{ items: Report[]; total: number }>(`/api/v1/admin/security/reports?${params}`)
      .then(d => { setReports(d.items); setTotal(d.total) })
      .catch(() => {})
  }, [page, passedFilter])

  useEffect(() => { load() }, [load])

  const columns = [
    { key: 'scenario', header: 'Scenario' },
    { key: 'actual', header: 'Result Summary' },
    { key: 'passed', header: 'Outcome', render: (r: Report) => (
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.passed ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>
        {r.passed ? 'PASS' : 'FAIL'}
      </span>
    )},
    { key: 'createdAt', header: 'Date', render: (r: Report) => new Date(r.createdAt).toLocaleString() },
  ]

  const passRate = reports.length > 0
    ? Math.round((reports.filter(r => r.passed).length / reports.length) * 100)
    : null

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Security Reports</h2>
          <p className="text-surface/50 text-sm mt-1">Results from wallet security test runs.</p>
        </div>
        <Link
          href="/admin/security-simulator"
          className="bg-primary text-bg text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          ▶ Run Scenarios
        </Link>
      </div>

      {passRate !== null && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-xl border border-white/5 p-4">
            <p className="text-sm text-surface/50">Total Reports</p>
            <p className="text-2xl font-bold text-surface mt-1">{total}</p>
          </div>
          <div className="bg-card rounded-xl border border-white/5 p-4">
            <p className="text-sm text-surface/50">Pass Rate</p>
            <p className={`text-2xl font-bold mt-1 ${passRate >= 80 ? 'text-primary' : passRate >= 50 ? 'text-warning' : 'text-danger'}`}>
              {passRate}%
            </p>
          </div>
          <div className="bg-card rounded-xl border border-white/5 p-4">
            <p className="text-sm text-surface/50">Failed</p>
            <p className="text-2xl font-bold text-danger mt-1">{reports.filter(r => !r.passed).length}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {[['', 'All'], ['true', 'Pass'], ['false', 'Fail']].map(([v, l]) => (
          <button key={v} onClick={() => { setPassedFilter(v); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${passedFilter === v ? 'bg-primary text-bg' : 'bg-white/5 text-surface/60 hover:bg-white/10'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-white/5">
        <Table columns={columns} data={reports} emptyMessage="No security reports yet. Run a test above." />
        <Pagination page={page} limit={20} total={total} onPage={setPage} />
      </div>
    </div>
  )
}
