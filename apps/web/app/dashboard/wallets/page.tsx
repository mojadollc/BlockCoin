'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { WalletCard } from '@/components/ui/WalletCard'
import { Modal } from '@/components/ui/Modal'
import { ShimmerCards } from '@/components/ui/Shimmer'
import { useUIFlags } from '@/hooks/useUIFlags'

interface Wallet {
  id: string
  label: string
  status: string
  balanceDisplay: string
  address: string
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const flags = useUIFlags()

  const load = useCallback(() => {
    setLoading(true)
    api.get<Wallet[]>('/api/v1/wallets').then(setWallets).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/api/v1/wallets', { label })
      setOpen(false)
      setLabel('')
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface">My Wallets</h1>
          <p className="text-surface/40 text-sm mt-0.5">{wallets.length} of 10 wallets</p>
        </div>
        {wallets.length < 10 && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-bg text-sm font-semibold px-4 py-2 rounded-xl active:scale-95 transition-transform"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        )}
      </div>

      {/* Wallet capacity bar */}
      {wallets.length > 0 && (
        <div className="px-4 mb-4">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(wallets.length / 10) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="px-4 pb-4">
        {loading ? (
          <ShimmerCards count={3} />
        ) : wallets.length === 0 ? (
          <div className="bg-card rounded-2xl border border-white/5 p-12 text-center mt-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-surface font-semibold mb-1">No wallets yet</p>
            <p className="text-surface/40 text-sm mb-6">Create your first USDT wallet to get started</p>
            <button
              onClick={() => setOpen(true)}
              className="bg-primary text-bg text-sm font-semibold px-8 py-3 rounded-xl active:scale-95 transition-transform"
            >
              Create First Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map(w => (
              <WalletCard key={w.id} wallet={w} onRefresh={load} />
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="New Wallet">
        {error && <p className="text-danger text-sm mb-4 bg-danger/10 p-3 rounded-xl">{error}</p>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-surface/60 mb-1.5">Wallet Name</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Main Wallet"
              className="w-full bg-sidebar border border-white/10 rounded-xl px-4 py-3 text-surface focus:outline-none focus:border-primary"
              required maxLength={100}
            />
          </div>
          {flags.show_wallet_notice && (
            <p className="text-xs text-warning bg-warning/10 p-3 rounded-xl">
              ⚠ This is a virtual wallet. Balances are simulated and not real USDT.
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-primary text-bg font-semibold py-3 rounded-xl active:scale-95 transition-transform"
          >
            Create Wallet
          </button>
        </form>
      </Modal>
    </div>
  )
}
