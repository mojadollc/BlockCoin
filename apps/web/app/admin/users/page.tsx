'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'
import { ShimmerTable } from '@/components/ui/Shimmer'
import { usePermission } from '@/hooks/usePermission'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: string
  _count: { virtualWallets: number }
}

export default function AdminUsersPage() {
  const { canWrite } = usePermission('users')
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'USER' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    setLoading(true)
    api.get<{ items: User[]; total: number }>(`/api/v1/admin/users?${params}`)
      .then(d => { setUsers(d.items); setTotal(d.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/api/v1/admin/users', form)
      setCreateOpen(false)
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'USER' })
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function toggleActive(user: User) {
    const endpoint = user.isActive
      ? `/api/v1/admin/users/${user.id}/suspend`
      : `/api/v1/admin/users/${user.id}/activate`
    await api.post(endpoint).catch(() => {})
    load()
  }

  const columns = [
    { key: 'email', header: 'Email' },
    { key: 'name', header: 'Name', render: (u: User) => `${u.firstName} ${u.lastName}` },
    { key: 'role', header: 'Role', render: (u: User) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-secondary/20 text-secondary' : 'bg-white/10 text-surface/60'}`}>
        {u.role}
      </span>
    )},
    { key: 'wallets', header: 'Wallets', render: (u: User) => String(u._count.virtualWallets) },
    { key: 'status', header: 'Status', render: (u: User) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>
        {u.isActive ? 'Active' : 'Suspended'}
      </span>
    )},
    { key: 'actions', header: '', render: (u: User) => (
      <div className="flex gap-2">
        <Link href={`/admin/users/${u.id}`} className="text-xs text-secondary hover:underline">View</Link>
        {canWrite && (
          <button onClick={() => toggleActive(u)} className="text-xs text-warning hover:underline">
            {u.isActive ? 'Suspend' : 'Activate'}
          </button>
        )}
      </div>
    )},
  ]

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Users</h2>
        {canWrite && (
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-bg text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition"
          >
            + Create User
          </button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-white/5 mb-4">
        <div className="p-4 border-b border-white/5">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by email or name…"
            className="bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-sm text-surface w-full max-w-sm focus:outline-none focus:border-primary"
          />
        </div>
        {loading ? <ShimmerTable rows={8} /> : <Table columns={columns} data={users} emptyMessage="No users found" />}
        <Pagination page={page} limit={20} total={total} onPage={setPage} />
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create User">
        {error && <p className="text-danger text-sm mb-4 bg-danger/10 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleCreate} className="space-y-4">
          {(['firstName', 'lastName', 'email'] as const).map(k => (
            <div key={k}>
              <label className="block text-sm text-surface/60 mb-1 capitalize">{k.replace(/([A-Z])/g, ' $1')}</label>
              <input
                value={form[k]}
                onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary"
                required
              />
            </div>
          ))}
          <div>
            <label className="block text-sm text-surface/60 mb-1">Password</label>
            <PasswordInput
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-surface/60 mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary"
            >
              <option value="USER">USER</option>
              <option value="SUB_ADMIN">SUB_ADMIN</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-primary text-bg font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition">
            Create
          </button>
        </form>
      </Modal>
    </div>
  )
}
