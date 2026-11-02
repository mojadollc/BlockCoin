'use client'
import { useEffect, useState } from 'react'
import { api } from '@/services/api'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get<Record<string, string>>('/api/v1/admin/settings').then(setSettings).catch(() => {})
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      await api.post('/api/v1/admin/settings', { key, value })
      setSettings(s => ({ ...s, [key]: value }))
      setMsg('Setting saved')
      setKey('')
      setValue('')
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">System Settings</h2>

      <div className="bg-card rounded-xl border border-white/5 p-6 mb-6">
        <h3 className="font-semibold mb-4">Current Settings</h3>
        {Object.keys(settings).length === 0 ? (
          <p className="text-surface/40 text-sm">No settings configured</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(settings).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-white/5 pb-2">
                <span className="font-mono text-surface/60">{k}</span>
                <span className="text-surface">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-white/5 p-6">
        <h3 className="font-semibold mb-4">Add / Update Setting</h3>
        {msg && <p className="text-sm mb-4 text-primary">{msg}</p>}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-surface/60 mb-1">Key</label>
            <input value={key} onChange={e => setKey(e.target.value)}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface font-mono focus:outline-none focus:border-primary"
              required placeholder="e.g. max_wallets_per_user" />
          </div>
          <div>
            <label className="block text-sm text-surface/60 mb-1">Value</label>
            <input value={value} onChange={e => setValue(e.target.value)}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary"
              required />
          </div>
          <button type="submit" className="bg-primary text-bg font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition">
            Save Setting
          </button>
        </form>
      </div>
    </div>
  )
}
