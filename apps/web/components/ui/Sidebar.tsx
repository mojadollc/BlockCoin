'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthUser } from '@blockcoin/shared'

const USER_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/dashboard/wallets', label: 'Wallets', icon: '◈' },
  { href: '/dashboard/transactions', label: 'Transactions', icon: '⇄' },
  { href: '/dashboard/simulations', label: 'Transactions', icon: '⚙' },
  { href: '/dashboard/testnet', label: 'Testnet', icon: '⛓' },
  { href: '/dashboard/profile', label: 'Profile', icon: '◉' },
]

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: '⊞' },
  { href: '/admin/users', label: 'Users', icon: '◉' },
  { href: '/admin/wallets', label: 'Wallets', icon: '◈' },
  { href: '/admin/transactions', label: 'Transactions', icon: '⇄' },
  { href: '/admin/simulations', label: 'Transactions', icon: '⚙' },
  { href: '/admin/templates', label: 'Templates', icon: '☰' },
  { href: '/admin/security-simulator', label: 'Security Simulator', icon: '🛡' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: '📋' },
  { href: '/admin/security', label: 'Reports', icon: '📊' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' },
]

function NavContent({ user, onLogout, onNav }: { user: AuthUser; onLogout: () => void; onNav?: () => void }) {
  const pathname = usePathname()
  const nav = user.role === 'ADMIN' ? ADMIN_NAV : USER_NAV

  return (
    <>
      <div className="p-6 border-b border-white/5">
        <h1 className="text-lg font-bold text-primary">BlockCoin</h1>
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-sidebar border-b border-white/5">
        <h1 className="text-base font-bold text-primary">BlockCoin</h1>
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
