'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/services/api'
import { StatusBadge } from '@/components/ui/Badge'
import { unitsToDisplay } from '@blockcoin/shared'
import { Modal } from '@/components/ui/Modal'

interface UserDetail {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: string
  virtualWallets: Array<{
    id: string
    label: string
    status: string
    createdAt: string
    ledgerAccount: { balanceUnits: string } | null
  }>
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get<UserDetail>(`/api/v1/admin/users/${id}`).then(setUser).catch(() => router.push('/admin/users'))
  }, [id, router])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post(`/api/v1/admin/users/${id}/reset-password`, { newPassword })
      setMsg('Password reset successfully')
      setResetOpen(false)
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function toggleActive() {
    if (!user) return
    const ep = user.isActive ? `/api/v1/admin/users/${id}/suspend` : `/api/v1/admin/users/${id}/activate`
    await api.post(ep).catch(() => {})
    api.get<UserDetail>(`/api/v1/admin/users/${id}`).then(setUser).catch(() => {})
  }

  if (!user) return <div className="p-8 text-surface/40">Loading…</div>

  return (
    <div className="p-8 max-w-3xl">
      <button onClick={() => router.back()} className="text-sm text-surface/40 hover:text-surface mb-6 flex items-center gap-1">
        ← Back
      </button>

      <div className="bg-card rounded-xl border border-white/5 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-surface/50 text-sm mt-1">{user.email}</p>
            <div className="flex gap-2 mt-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-secondary/20 text-secondary' : 'bg-white/10 text-surface/60'}`}>
                {user.role}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>
                {user.isActive ? 'Active' : 'Suspended'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleActive}
              className="text-sm px-3 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition"
            >
              {user.isActive ? 'Suspend' : 'Activate'}
            </button>
            <button
              onClick={() => setResetOpen(true)}
              className="text-sm px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition"
            >
              Reset Password
            </button>
          </div>
        </div>
        {msg && <p className="mt-3 text-sm text-primary">{msg}</p>}
      </div>

      <div className="bg-card rounded-xl border border-white/5">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold">Virtual Wallets ({user.virtualWallets.length})</h3>
        </div>
        {user.virtualWallets.length === 0 ? (
          <p className="p-4 text-surface/40 text-sm">No wallets</p>
        ) : (
          <div className="divide-y divide-white/5">
            {user.virtualWallets.map(w => (
              <div key={w.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{w.label}</p>
                  <p className="text-xs text-surface/40 mt-0.5">ID: {w.id}</p>
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

      <Modal isOpen={resetOpen} onClose={() => setResetOpen(false)} title="Reset Password">
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm text-surface/60 mb-1">New Password</label>
            <input
              type="password"
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
    </div>
  )
}
