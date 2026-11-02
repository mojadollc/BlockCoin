'use client'
import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { StatCard } from '@/components/ui/StatCard'

interface DashboardData {
  stats: { totalUsers: number; activeUsers: number; totalWallets: number; totalSimulations: number }
  recentLogs: Array<{ id: string; action: string; createdAt: string; actor: { email: string } }>
  simsByStatus: Array<{ status: string; _count: { status: number } }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.get<DashboardData>('/api/v1/admin/dashboard').then(setData).catch(() => {})
  }, [])

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Dashboard</h2>
          <p className="text-surface/50 text-sm mt-1">BlockCoin USDT Platform — Control Panel</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard label="Total Users" value={data?.stats.totalUsers ?? '—'} color="text-primary" />
        <StatCard label="Active Users" value={data?.stats.activeUsers ?? '—'} color="text-secondary" sub="Currently active" />
        <StatCard label="Wallets" value={data?.stats.totalWallets ?? '—'} color="text-warning" />
        <StatCard label="Simulations" value={data?.stats.totalSimulations ?? '—'} color="text-surface" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-white/5">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-semibold">Simulations by Status</h3>
          </div>
          <div className="p-4 space-y-2">
            {data?.simsByStatus.length === 0 && (
              <p className="text-surface/40 text-sm">No simulations yet</p>
            )}
            {data?.simsByStatus.map(s => (
              <div key={s.status} className="flex justify-between text-sm">
                <span className="text-surface/60">{s.status}</span>
                <span className="font-medium">{s._count.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-white/5">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-semibold">Recent Admin Activity</h3>
          </div>
          <div className="divide-y divide-white/5">
            {data?.recentLogs.length === 0 && (
              <p className="p-4 text-surface/40 text-sm">No activity yet</p>
            )}
            {data?.recentLogs.map(log => (
              <div key={log.id} className="px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-primary font-medium">{log.action}</span>
                  <span className="text-surface/40 text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-surface/50 text-xs mt-0.5">{log.actor.email}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
