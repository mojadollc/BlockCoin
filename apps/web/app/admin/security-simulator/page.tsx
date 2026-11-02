'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { Pagination } from '@/components/ui/Pagination'
import Link from 'next/link'

interface ScenarioCheck { id: string; name: string; description: string }
interface Scenario {
  id: string
  name: string
  category: string
  description: string
  expectedBehavior: string
  securityChecks: ScenarioCheck[]
}
interface Wallet { id: string; label: string; status: string }
interface Report {
  id: string
  scenario: string
  expected: string
  actual: string
  passed: boolean
  walletId: string | null
  createdAt: string
}

const CATEGORY_COLORS: Record<string, string> = {
  BALANCE_APPEARANCE: 'bg-primary/20 text-primary',
  TRANSACTION_NOTIFICATION: 'bg-secondary/20 text-secondary',
  PENDING_BEHAVIOR: 'bg-warning/20 text-warning',
  SUCCESS_BEHAVIOR: 'bg-primary/20 text-primary',
  FAILURE_BEHAVIOR: 'bg-danger/20 text-danger',
  EXPIRY_BEHAVIOR: 'bg-warning/20 text-warning',
  HISTORY_UPDATE: 'bg-secondary/20 text-secondary',
  SYNC_BEHAVIOR: 'bg-surface/20 text-surface/60',
  DELAYED_UPDATE: 'bg-surface/20 text-surface/60',
  SUSPICIOUS_RECORD: 'bg-danger/20 text-danger',
}

export default function SecuritySimulatorPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Scenario | null>(null)
  const [walletId, setWalletId] = useState('')
  const [amount, setAmount] = useState('100.000000')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<null | {
    passed: boolean
    summary: string
    checks: Array<{ checkId: string; checkName: string; passed: boolean; detail: string }>
    reportId: string
    simulationId: string | null
  }>(null)
  const [error, setError] = useState('')
  const [passedFilter, setPassedFilter] = useState('')

  const loadReports = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: '10' })
    if (passedFilter) params.set('passed', passedFilter)
    api.get<{ items: Report[]; total: number }>(`/api/v1/admin/security/reports?${params}`)
      .then(d => { setReports(d.items); setTotal(d.total) })
      .catch(() => {})
  }, [page, passedFilter])

  useEffect(() => {
    api.get<Scenario[]>('/api/v1/admin/security/scenarios').then(setScenarios).catch(() => {})
    api.get<{ items: Wallet[] }>('/api/v1/admin/wallets?limit=100')
      .then(d => setWallets(d.items.filter((w: Wallet) => w.status === 'ACTIVE')))
      .catch(() => {})
    loadReports()
  }, [loadReports])

  async function handleRun(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !walletId) return
    setRunning(true)
    setResult(null)
    setError('')
    try {
      const res = await api.post<typeof result>('/api/v1/admin/security/run', {
        scenarioId: selected.id,
        walletId,
        amountDisplay: amount,
      })
      setResult(res)
      loadReports()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Scenario failed')
    } finally {
      setRunning(false)
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/v1/admin/security/reports/${id}`).catch(() => {})
    loadReports()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Security Simulator</h2>
        <p className="text-surface/50 text-sm mt-1">
          Test wallet interface behavior under controlled scenarios. All tests run within BlockCoin's internal environment.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Scenario picker */}
        <div className="xl:col-span-1">
          <div className="bg-card rounded-xl border border-white/5">
            <div className="p-4 border-b border-white/5">
              <h3 className="font-semibold text-sm">Test Scenarios</h3>
            </div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {scenarios.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelected(s); setResult(null); setError('') }}
                  className={`w-full text-left px-4 py-3 hover:bg-white/3 transition ${selected?.id === s.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{s.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${CATEGORY_COLORS[s.category] ?? 'bg-white/10 text-surface/60'}`}>
                      {s.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-surface/40 mt-1 leading-relaxed">{s.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Run panel */}
        <div className="xl:col-span-2 space-y-4">
          {selected ? (
            <>
              <div className="bg-card rounded-xl border border-white/5 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{selected.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${CATEGORY_COLORS[selected.category] ?? ''}`}>
                      {selected.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-xs text-surface/50 mb-1">Description</p>
                    <p className="text-sm text-surface/80">{selected.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface/50 mb-1">Expected Behavior</p>
                    <p className="text-sm text-surface/80">{selected.expectedBehavior}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface/50 mb-2">Security Checks ({selected.securityChecks.length})</p>
                    <div className="space-y-1">
                      {selected.securityChecks.map(c => (
                        <div key={c.id} className="flex items-start gap-2 text-xs">
                          <span className="text-surface/30 mt-0.5">◦</span>
                          <div>
                            <span className="text-surface/70 font-medium">{c.name}</span>
                            <span className="text-surface/40"> — {c.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleRun} className="space-y-4 border-t border-white/5 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-surface/60 mb-1">Target Wallet</label>
                      <select
                        value={walletId}
                        onChange={e => setWalletId(e.target.value)}
                        className="w-full bg-sidebar border border-white/10 rounded-lg px-3 py-2 text-sm text-surface focus:outline-none focus:border-primary"
                        required
                      >
                        <option value="">Select wallet…</option>
                        {wallets.map(w => (
                          <option key={w.id} value={w.id}>{w.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-surface/60 mb-1">Test Amount (USDT)</label>
                      <input
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full bg-sidebar border border-white/10 rounded-lg px-3 py-2 text-sm text-surface font-mono focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  {error && <p className="text-danger text-sm bg-danger/10 p-3 rounded-lg">{error}</p>}
                  <button
                    type="submit"
                    disabled={running}
                    className="w-full bg-primary text-bg font-semibold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {running ? (
                      <>
                        <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                        Running scenario…
                      </>
                    ) : (
                      '▶ Run Scenario'
                    )}
                  </button>
                </form>
              </div>

              {/* Results */}
              {result && (
                <div className={`bg-card rounded-xl border p-6 ${result.passed ? 'border-primary/30' : 'border-danger/30'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Test Results</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.passed ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>
                      {result.passed ? '✓ PASS' : '✗ FAIL'}
                    </span>
                  </div>
                  <p className="text-sm text-surface/60 mb-4">{result.summary}</p>

                  <div className="space-y-2 mb-4">
                    {result.checks.map(c => (
                      <div key={c.checkId} className={`flex items-start gap-3 p-3 rounded-lg ${c.passed ? 'bg-primary/5' : 'bg-danger/5'}`}>
                        <span className={`text-sm mt-0.5 shrink-0 ${c.passed ? 'text-primary' : 'text-danger'}`}>
                          {c.passed ? '✓' : '✗'}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{c.checkName}</p>
                          <p className="text-xs text-surface/50 mt-0.5">{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 text-xs text-surface/40 border-t border-white/5 pt-3">
                    <span>Report ID: {result.reportId.slice(0, 12)}…</span>
                    {result.simulationId && (
                      <Link href={`/dashboard/simulations/${result.simulationId}`} className="text-secondary hover:underline">
                        View simulation →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-card rounded-xl border border-white/5 p-12 text-center">
              <p className="text-surface/40">Select a scenario from the left to begin testing</p>
            </div>
          )}
        </div>
      </div>

      {/* Reports history */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Security Report History</h3>
          <div className="flex gap-2">
            {[['', 'All'], ['true', 'Pass'], ['false', 'Fail']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => { setPassedFilter(v); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${passedFilter === v ? 'bg-primary text-bg' : 'bg-white/5 text-surface/60 hover:bg-white/10'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-white/5">
          {reports.length === 0 ? (
            <p className="p-8 text-center text-surface/40">No reports yet. Run a scenario above.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {reports.map(r => (
                <div key={r.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 text-sm shrink-0 ${r.passed ? 'text-primary' : 'text-danger'}`}>
                      {r.passed ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{r.scenario}</p>
                      <p className="text-xs text-surface/40 mt-0.5">{r.actual}</p>
                      <p className="text-xs text-surface/30 mt-0.5">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.passed ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>
                      {r.passed ? 'PASS' : 'FAIL'}
                    </span>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-surface/30 hover:text-danger transition"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={page} limit={10} total={total} onPage={setPage} />
        </div>
      </div>
    </div>
  )
}
