'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'

interface Template {
  id: string
  name: string
  type: string
  description: string | null
  defaultDelay: number
  isActive: boolean
  createdAt: string
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'CREDIT', description: '', defaultDelay: 0 })
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.get<Template[]>('/api/v1/admin/templates').then(setTemplates).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/api/v1/admin/templates', form)
      setOpen(false)
      setForm({ name: '', type: 'CREDIT', description: '', defaultDelay: 0 })
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function deactivate(id: string) {
    await api.delete(`/api/v1/admin/templates/${id}`).catch(() => {})
    load()
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type' },
    { key: 'description', header: 'Description', render: (t: Template) => t.description ?? '—' },
    { key: 'defaultDelay', header: 'Delay (s)', render: (t: Template) => String(t.defaultDelay) },
    { key: 'isActive', header: 'Status', render: (t: Template) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${t.isActive ? 'bg-primary/20 text-primary' : 'bg-white/10 text-surface/40'}`}>
        {t.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', header: '', render: (t: Template) => t.isActive ? (
      <button onClick={() => deactivate(t.id)} className="text-xs text-danger hover:underline">Deactivate</button>
    ) : null },
  ]

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Simulation Templates</h2>
        <button
          onClick={() => setOpen(true)}
          className="bg-primary text-bg text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          + New Template
        </button>
      </div>

      <div className="bg-card rounded-xl border border-white/5">
        <Table columns={columns} data={templates} emptyMessage="No templates yet" />
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Template">
        {error && <p className="text-danger text-sm mb-4 bg-danger/10 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-surface/60 mb-1">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="block text-sm text-surface/60 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary">
              <option value="CREDIT">CREDIT</option>
              <option value="DEBIT">DEBIT</option>
              <option value="TRANSFER">TRANSFER</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-surface/60 mb-1">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-surface/60 mb-1">Default Delay (seconds)</label>
            <input type="number" min={0} value={form.defaultDelay} onChange={e => setForm(f => ({ ...f, defaultDelay: Number(e.target.value) }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary" />
          </div>
          <button type="submit" className="w-full bg-primary text-bg font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition">
            Create Template
          </button>
        </form>
      </Modal>
    </div>
  )
}
