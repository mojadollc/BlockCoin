'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'

interface EnvEntry { value: string; isSecret: boolean }
type EnvMap = Record<string, EnvEntry>

const GROUPS = [
  {
    label: 'Testnet — Ethereum Sepolia',
    color: 'text-secondary',
    keys: ['SEPOLIA_RPC_URL', 'SEPOLIA_USDT_CONTRACT'],
  },
  {
    label: 'Testnet — TRON Nile',
    color: 'text-warning',
    keys: ['TRON_NILE_URL', 'TRON_NILE_API_KEY', 'TRON_NILE_USDT_CONTRACT'],
  },
  {
    label: 'JWT / Auth',
    color: 'text-danger',
    keys: ['JWT_SECRET', 'JWT_EXPIRES_IN', 'REFRESH_TOKEN_SECRET', 'REFRESH_TOKEN_EXPIRES_IN'],
  },
  {
    label: 'API & Web',
    color: 'text-primary',
    keys: ['API_PORT', 'API_URL', 'NODE_ENV', 'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_WS_URL'],
  },
]

function EnvRow({
  envKey, entry, onSave,
}: {
  envKey: string
  entry: EnvEntry
  onSave: (key: string, value: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(entry.value)
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(envKey, val)
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCancel() {
    setVal(entry.value)
    setEditing(false)
  }

  const displayVal = entry.isSecret && !show
    ? (entry.value ? '••••••••••••••••' : '(not set)')
    : (entry.value || '(not set)')

  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-1">
        <span className="font-mono text-xs text-surface/60 pt-0.5 shrink-0">{envKey}</span>
        <div className="flex items-center gap-2 shrink-0">
          {saved && <span className="text-xs text-primary">Saved ✓</span>}
          {entry.isSecret && !editing && (
            <button onClick={() => setShow(s => !s)} className="text-xs text-surface/40 hover:text-surface transition">
              {show ? 'hide' : 'show'}
            </button>
          )}
          {!editing && (
            <button onClick={() => { setEditing(true); setVal(entry.value) }}
              className="text-xs text-secondary hover:underline">
              Edit
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex gap-2 mt-1">
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            type={entry.isSecret ? 'password' : 'text'}
            autoFocus
            className="flex-1 bg-sidebar border border-white/10 rounded-lg px-3 py-1.5 text-sm text-surface font-mono focus:outline-none focus:border-primary min-w-0"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-primary text-bg font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition shrink-0"
          >
            {saving ? '…' : 'Save'}
          </button>
          <button onClick={handleCancel} className="text-xs text-surface/40 hover:text-surface px-2 transition shrink-0">
            Cancel
          </button>
        </div>
      ) : (
        <p className={`text-sm font-mono break-all ${entry.value ? 'text-surface/80' : 'text-surface/30 italic'}`}>
          {displayVal}
        </p>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const [envKeys, setEnvKeys] = useState<EnvMap>({})
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.get<EnvMap>('/api/v1/admin/env-keys').then(setEnvKeys).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(key: string, value: string) {
    setError('')
    try {
      await api.post('/api/v1/admin/env-keys', { key, value })
      setEnvKeys(prev => ({ ...prev, [key]: { ...prev[key], value } }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Environment Settings</h2>
        <p className="text-surface/50 text-sm mt-1">
          Manage <span className="font-mono text-surface/70">.env</span> keys. Changes apply immediately and persist to disk.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger text-sm p-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6">
        <p className="text-xs text-warning font-semibold mb-1">⚠ Caution</p>
        <p className="text-xs text-surface/60">
          Changing JWT secrets will invalidate all active sessions. Changing API URLs requires a server restart to take full effect. All changes are recorded in the audit log.
        </p>
      </div>

      <div className="space-y-4">
        {GROUPS.map(group => (
          <div key={group.label} className="bg-card rounded-xl border border-white/5">
            <div className="px-5 py-3 border-b border-white/5">
              <h3 className={`text-sm font-semibold ${group.color}`}>{group.label}</h3>
            </div>
            <div className="px-5">
              {group.keys.map(key => (
                envKeys[key] ? (
                  <EnvRow key={key} envKey={key} entry={envKeys[key]} onSave={handleSave} />
                ) : (
                  <div key={key} className="py-3 border-b border-white/5 last:border-0">
                    <span className="font-mono text-xs text-surface/30">{key}</span>
                    <p className="text-xs text-surface/20 mt-0.5">Loading…</p>
                  </div>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
