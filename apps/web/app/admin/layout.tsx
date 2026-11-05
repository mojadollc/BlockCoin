'use client'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/ui/Sidebar'
import { MobileNav } from '@/components/ui/MobileNav'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-primary animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      <MobileNav user={user} />
    </div>
  )
}
