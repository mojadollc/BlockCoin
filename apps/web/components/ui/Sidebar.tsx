'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthUser } from '@blockcoin/shared'

const USER_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/dashboard/wallets', label: 'Wallets', icon: '◈' },
  { href: '/dashboard/transactions', label: 'Transactions', icon: '⇄' },
  { href: '/dashboard/simulations', label: 'Simulations', icon: '⚙' },
  { href: '/dashboard/testnet', label: 'Testnet', icon: '⛓' },
  { href: '/dashboard/profile', label: 'Profile', icon: '◉' },
]

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: '⊞' },
  { href: '/admin/users', label: 'Users', icon: '◉' },
  { href: '/admin/wallets', label: 'Wallets', icon: '◈' },
  { href: '/admin/transactions', label: 'Transactions', icon: '⇄' },
  { href: '/admin/simulations', label: 'Simulations', icon: '⚙' },
  { href: '/admin/templates', label: 'Templates', icon: '☰' },
  { href: '/admin/security-simulator', label: 'Security Simulator', icon: '🛡' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: '📋' },
  { href: '/admin/security', label: 'Reports', icon: '📊' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' },
]

export function Sidebar({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const pathname = usePathname()
  const nav = user.role === 'ADMIN' ? ADMIN_NAV : USER_NAV

  return (
    <aside className="w-64 bg-sidebar min-h-screen flex flex-col border-r border-white/5">
      <div className="p-6 border-b border-white/5">
        <h1 className="text-lg font-bold text-primary">BlockCoin Lab</h1>
        <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded-full mt-1 inline-block">
          INTERNAL ENVIRONMENT
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
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
        <button
          onClick={onLogout}
          className="text-xs text-surface/40 hover:text-danger transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
