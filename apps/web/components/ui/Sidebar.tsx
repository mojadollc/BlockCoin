'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthUser } from '@blockcoin/shared'
import { api } from '@/services/api'

const USER_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞', feature: null },
  { href: '/dashboard/wallets', label: 'Wallets', icon: '◈', feature: null },
  { href: '/dashboard/deposits', label: 'Deposit USDT', icon: '↓', feature: null },
  { href: '/dashboard/transactions', label: 'Transactions', icon: '⇄', feature: null },
  { href: '/dashboard/profile', label: 'Profile', icon: '◉', feature: null },
]

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: '⊞', feature: null },
  { href: '/admin/users', label: 'Users', icon: '◉', feature: 'users' },
  { href: '/admin/wallets', label: 'Wallets', icon: '◈', feature: 'wallets' },
  { href: '/admin/deposits', label: 'Deposits', icon: '↓', feature: 'deposits' },
  { href: '/admin/transactions', label: 'Transactions', icon: '⇄', feature: 'transactions' },
  { href: '/admin/simulations', label: 'Payments', icon: '⚙', feature: 'payments' },
  { href: '/admin/templates', label: 'Templates', icon: '☰', feature: 'templates' },
  { href: '/admin/security-simulator', label: 'Security Testing', icon: '🛡', feature: 'security' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: '📋', feature: 'audit_logs' },
  { href: '/admin/security', label: 'Reports', icon: '📊', feature: 'security' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙', feature: 'settings' },
]

function NavContent({ user, onLogout, onNav }: { user: AuthUser; onLogout: () => void; onNav?: () => void }) {
  const pathname = usePathname()
  const [allowedFeatures, setAllowedFeatures] = useState<string[]>([])

  useEffect(() => {
    if (user.role === 'SUB_ADMIN') {
      api.get<Array<{ feature: string; level: string }>>(`/api/v1/admin/users/${user.id}/permissions`)
        .then(perms => setAllowedFeatures(perms.map(p => p.feature)))
        .catch(() => {})
    }
  }, [user.id, user.role])

  const baseNav = user.role === 'USER' ? USER_NAV : ADMIN_NAV
  const nav = user.role === 'SUB_ADMIN'
    ? baseNav.filter(item => item.feature === null || allowedFeatures.includes(item.feature))
    : baseNav

  return (
    <>
      <div className="p-6 border-b border-white/5">
        <Link href="/" className="text-lg font-bold text-primary hover:text-primary/80 transition-colors">BlockCoin</Link>
        <p className="text-xs text-surface/40 mt-0.5">USDT Platform</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNav}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              pathname === item.href
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-surface/60 hover:text-surface hover:bg-white/5'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="text-sm text-surface/70 mb-2">
          {user.firstName} {user.lastName}
          {user.role === 'ADMIN' && (
            <span className="ml-2 text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded">ADMIN</span>
          )}
        </div>
        <button onClick={onLogout} className="text-xs text-surface/40 hover:text-danger transition">
          Sign out
        </button>
      </div>
    </>
  )
}

export function Sidebar({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 bg-sidebar border-b border-white/5" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px' }}>
        <Link href="/" className="text-base font-bold text-primary hover:text-primary/80 transition-colors">BlockCoin</Link>
        <button onClick={() => setOpen(true)} className="text-surface/70 hover:text-surface p-1" aria-label="Open menu">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />}

      <aside className={`md:hidden fixed top-0 left-0 h-full w-72 z-50 bg-sidebar flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-end px-4 py-3 border-b border-white/5">
          <button onClick={() => setOpen(false)} className="text-surface/50 hover:text-surface p-1" aria-label="Close menu">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <NavContent user={user} onLogout={onLogout} onNav={() => setOpen(false)} />
      </aside>

      <aside className="hidden md:flex w-64 bg-sidebar min-h-screen flex-col border-r border-white/5 shrink-0">
        <NavContent user={user} onLogout={onLogout} />
      </aside>
    </>
  )
}
