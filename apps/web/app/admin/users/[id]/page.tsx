'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/services/api'
import { unitsToDisplay } from '@blockcoin/shared'
import { Modal } from '@/components/ui/Modal'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { usePermission } from '@/hooks/usePermission'

const FEATURES: { key: string; label: string; desc: string }[] = [
  { key: 'users',        label: 'Users',           desc: 'View and manage user accounts' },
  { key: 'wallets',      label: 'Wallets',          desc: 'View wallets and adjust balances' },
  { key: 'transactions', label: 'Transactions',     desc: 'View transaction history' },
  { key: 'payments',     label: 'Payments',         desc: 'Create and manage payments' },
  { key: 'templates',    label: 'Templates',        desc: 'Manage payment templates' },
  { key: 'security',     label: 'Security',         desc: 'Run security tests and view reports' },
  { key: 'audit_logs',   label: 'Audit Logs',       desc: 'View admin activity logs' },
  { key: 'settings',     label: 'Settings',         desc: 'View and edit platform settings' },
  { key: 'deposits',     label: 'Deposits',         desc: 'Review and approve deposits' },
]

interface Permission { feature: string; level: 'READ' | 'WRITE' }

interface UserDetail {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: string
  virtualWallets: Array<{
    id: string; label: string; status: string; createdAt: string
    ledgerAccount: { balanceUnits: string } | null
  }>
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { canWrite } = usePermission('users')

  const [user, setUser] = useState<UserDetail | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permMsg, setPermMsg] = useState('')
  const [permSaving, setPermSaving] = useState(false)

  function loadUser() {
    api.get<UserDetail>(`/api/v1/admin/users/${id}`).then(setUser).catch(() => router.push('/admin/users'))
  }

  function loadPermissions() {
    api.get<Permission[]>(`/api/v1/admin/users/${id}/permissions`)
      .then(setPermissions)
      .catch(() => {})
  }

  useEffect(() => { loadUser() }, [id])
  useEffect(() => { if (user?.role === 'SUB_ADMIN') loadPermissions() }, [user?.role])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post(`/api/v1/admin/users/${id}/reset-password`, { newPassword })
      setMsg('Password reset successfully')
      setResetOpen(false)
      setNewPassword('')
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function toggleActive() {
    if (!user) return
    const ep = user.isActive ? `/api/v1/admin/users/${id}/suspend` : `/api/v1/admin/users/${id}/activate`
    await api.post(ep).catch(() => {})
    loadUser()
  }

  function getLevel(feature: string): 'NONE' | 'READ' | 'WRITE' {
    const p = permissions.find(p => p.feature === feature)
    return p ? p.level : 'NONE'
  }

  function setLevel(feature: string, level: 'NONE' | 'READ' | 'WRITE') {
    if (level === 'NONE') {
      setPermissions(prev => prev.filter(p => p.feature !== feature))
    } else {
      setPermissions(prev => {
        const existing = prev.find(p => p.feature === feature)
        if (existing) return prev.map(p => p.feature === feature ? { ...p, level } : p)
        return [...prev, { feature, level }]
      })
    }
  }

  async function savePermissions() {
    setPermSaving(true)
    setPermMsg('')
    try {
      await api.post(`/api/v1/admin/users/${id}/permissions`, { permissions })
      setPermMsg('Permissions saved successfully')
    } catch (err: unknown) {
      setPermMsg(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setPermSaving(false)
    }
  }

  if (!user) return <div className="p-8 text-surface/40">Loading…</div>

  const roleColor = user.role === 'ADMIN'
    ? 'bg-secondary/20 text-secondary'
    : user.role === 'SUB_ADMIN'
    ? 'bg-warning/20 text-warning'
    : 'bg-white/10 text-surface/60'

  return (
    <div className="p-4 md:p-8 max-w-3xl space-y-6">
      <button onClick={() => router.back()} className="text-sm text-surface/40 hover:text-surface flex items-center gap-1">
        ← Back
      </button>

      {/* User info */}
      <div className="bg-card rounded-xl border border-white/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-surface/50 text-sm mt-1">{user.email}</p>
            <div className="flex gap-2 mt-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleColor}`}>{user.role}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>
                {user.isActive ? 'Active' : 'Suspended'}
              </span>
            </div>
          </div>
          {/* Only show action buttons if WRITE permission */}
          {canWrite && (
            <div className="flex gap-2 flex-wrap justify-end">
              <button onClick={toggleActive}
                className="text-sm px-3 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition">
                {user.isActive ? 'Suspend' : 'Activate'}
              </button>
              <button onClick={() => setResetOpen(true)}
                className="text-sm px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition">
                Reset Password
              </button>
            </div>
          )}
        </div>
        {!canWrite && (
          <p className="mt-3 text-xs text-surface/30 italic">👁 View only — you have READ access to Users</p>
        )}
        {msg && <p className="mt-3 text-sm text-primary">{msg}</p>}
      </div>

      {/* Permissions matrix — only for SUB_ADMIN targets, only visible if viewer has WRITE */}
      {user.role === 'SUB_ADMIN' && canWrite && (
        <div className="bg-card rounded-xl border border-white/5">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Permissions</h3>
              <p className="text-xs text-surface/40 mt-0.5">
                {canWrite ? 'Control what this sub-admin can access' : 'Permissions assigned to this sub-admin'}
              </p>
            </div>
            {canWrite && (
              <button
                onClick={savePermissions}
                disabled={permSaving}
                className="bg-primary text-bg text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
              >
                {permSaving ? 'Saving…' : 'Save Permissions'}
              </button>
            )}
          </div>

          {permMsg && (
            <div className={`mx-4 mt-4 p-3 rounded-lg text-sm ${permMsg.includes('success') ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>
              {permMsg}
            </div>
          )}

          <div className="divide-y divide-white/5">
            {FEATURES.map(f => {
              const level = getLevel(f.key)
              return (
                <div key={f.key} className="px-4 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-surface/40 mt-0.5">{f.desc}</p>
                  </div>
                  {canWrite ? (
                    /* Editable buttons for WRITE viewers */
                    <div className="flex items-center gap-1 shrink-0">
                      {(['NONE', 'READ', 'WRITE'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => setLevel(f.key, opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            level === opt
                              ? opt === 'NONE'
                                ? 'bg-white/10 text-surface'
                                : opt === 'READ'
                                ? 'bg-secondary/20 text-secondary border border-secondary/30'
                                : 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-white/5 text-surface/40 hover:bg-white/10 hover:text-surface/70'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Read-only badge for READ viewers */
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      level === 'WRITE'
                        ? 'bg-primary/20 text-primary'
                        : level === 'READ'
                        ? 'bg-secondary/20 text-secondary'
                        : 'bg-white/5 text-surface/30'
                    }`}>
                      {level}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="p-4 border-t border-white/5 flex items-center gap-4 text-xs text-surface/40">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/20" /> NONE — no access</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary" /> READ — view only</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> WRITE — full access</span>
          </div>
        </div>
      )}

      {/* Wallets */}
      <div className="bg-card rounded-xl border border-white/5">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold">Wallets ({user.virtualWallets.length})</h3>
        </div>
        {user.virtualWallets.length === 0 ? (
          <p className="p-4 text-surface/40 text-sm">No wallets</p>
        ) : (
          <div className="divide-y divide-white/5">
            {user.virtualWallets.map(w => (
              <div key={w.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{w.label}</p>
                  <p className="text-xs text-surface/40 mt-0.5 font-mono">{w.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-primary">
                    {w.ledgerAccount ? unitsToDisplay(BigInt(w.ledgerAccount.balanceUnits)) : '0.000000'} USDT
                  </p>
                  <p className="text-xs text-surface/40 mt-0.5">{w.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {canWrite && (
        <Modal isOpen={resetOpen} onClose={() => setResetOpen(false)} title="Reset Password">
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm text-surface/60 mb-1">New Password</label>
              <PasswordInput
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary"
                required minLength={8}
              />
            </div>
            <button type="submit" className="w-full bg-primary text-bg font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition">
              Reset Password
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
