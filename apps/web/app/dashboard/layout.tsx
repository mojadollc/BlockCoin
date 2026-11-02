'use client'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/ui/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-primary animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
