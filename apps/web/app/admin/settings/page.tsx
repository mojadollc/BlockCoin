'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { UIFlags } from '@/hooks/useUIFlags'

interface EnvEntry { value: string; isSecret: boolean }
type EnvMap = Record<string, EnvEntry>

const ENV_GROUPS = [
  {
    label: 'Deposit Addresses (Your Real USDT Wallets)',
    color: 'text-primary',
    keys: ['DEPOSIT_ETH_ADDRESS', 'DEPOSIT_TRON_ADDRESS'],
    description: 'Customers send real USDT to these addresses. Set these to your own wallet addresses.',
  },
  {
    label: 'Testnet — Ethereum Sepolia',
    color: 'text-secondary',
    keys: ['SEPOLIA_RPC_URL', 'SEPOLIA_USDT_CONTRACT'],
    description: null,
  },
  {
    label: 'Testnet — TRON Nile',
    color: 'text-warning',
    keys: ['TRON_NILE_URL', 'TRON_NILE_API_KEY', 'TRON_NILE_USDT_CONTRACT'],
    description: null,
  },
  {
    label: 'JWT / Auth',
    color: 'text-danger',
    keys: ['JWT_SECRET', 'JWT_EXPIRES_IN', 'REFRESH_TOKEN_SECRET', 'REFRESH_TOKEN_EXPIRES_IN'],
    description: null,
  },
  {
    label: 'API & Web',
    color: 'text-primary',
    keys: ['API_PORT', 'API_URL', 'NODE_ENV', 'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_WS_URL'],
    description: null,
  },
]

const UI_NOTICE_FLAGS: { flag: keyof UIFlags; label: string; description: string }[] = [
  {
    flag: 'show_env_badge',
    label: 'Environment badge',
    description: 'Shows the environment badge on dashboard pages.',
  },
  {
    flag: 'show_wallet_notice',
    label: 'Wallet notice',
    description: 'Shows an informational notice when creating a wallet.',
  },
  {
    flag: 'show_simulation_notice',
    label: 'Transaction notice',
    description: 'Shows an informational notice when creating a transaction.',
  },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${checked ? 'bg-primary' : 'bg-white/10'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function EnvRow({ envKey, entry, onSave }: { envKey: string; entry: EnvEntry; onSave: (key: string, value: string) => Promise<void> }) {
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
            <button onClick={() => { setEditing(true); setVal(entry.value) }} className="text-xs text-secondary hover:underline">
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
          <button onClick={handleSave} disabled={saving}
            className="text-xs bg-primary text-bg font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition shrink-0">
            {saving ? '…' : 'Save'}
          </button>
          <button onClick={() => { setVal(entry.value); setEditing(false) }}
            className="text-xs text-surface/40 hover:text-surface px-2 transition shrink-0">
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
  const [flags, setFlags] = useState<UIFlags>({ show_wallet_notice: true, show_simulation_notice: true, show_env_badge: true })
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.get<EnvMap>('/api/v1/admin/env-keys').then(setEnvKeys).catch(() => {})
    api.get<UIFlags>('/api/v1/ui-flags').then(setFlags).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  async function handleEnvSave(key: string, value: string) {
    setError('')
    try {
      await api.post('/api/v1/admin/env-keys', { key, value })
      setEnvKeys(prev => ({ ...prev, [key]: { ...prev[key], value } }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  async function handleFlagToggle(flag: keyof UIFlags, value: boolean) {
    setError('')
    try {
      await api.post('/api/v1/admin/ui-flags', { flag, value })
      setFlags(prev => ({ ...prev, [flag]: value }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Settings</h2>
        <p className="text-surface/50 text-sm mt-1">Manage UI notices and environment configuration.</p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* UI Notices */}
      <div>
        <h3 className="text-sm font-semibold text-surface/70 uppercase tracking-wider mb-3">UI Notices & Badges</h3>
        <div className="bg-card rounded-xl border border-white/5 divide-y divide-white/5">
          {UI_NOTICE_FLAGS.map(({ flag, label, description }) => (
            <div key={flag} className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-surface/40 mt-0.5 leading-relaxed">{description}</p>
              </div>
              <Toggle checked={flags[flag]} onChange={v => handleFlagToggle(flag, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Env keys */}
      <div>
        <h3 className="text-sm font-semibold text-surface/70 uppercase tracking-wider mb-3">Environment Keys</h3>
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-4">
          <p className="text-xs text-warning font-semibold mb-1">⚠ Caution</p>
          <p className="text-xs text-surface/60">
            Changing JWT secrets will invalidate all active sessions. Changing API URLs requires a server restart. All changes are recorded in the audit log.
          </p>
        </div>
        <div className="space-y-4">
          {ENV_GROUPS.map(group => (
            <div key={group.label} className="bg-card rounded-xl border border-white/5">
              <div className="px-5 py-3 border-b border-white/5">
                <h4 className={`text-sm font-semibold ${group.color}`}>{group.label}</h4>
                {group.description && (
                  <p className="text-xs text-surface/40 mt-0.5">{group.description}</p>
                )}
              </div>
              <div className="px-5">
                {group.keys.map(key =>
                  envKeys[key] ? (
                    <EnvRow key={key} envKey={key} entry={envKeys[key]} onSave={handleEnvSave} />
                  ) : (
                    <div key={key} className="py-3 border-b border-white/5 last:border-0">
                      <span className="font-mono text-xs text-surface/30">{key} — Loading…</span>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
