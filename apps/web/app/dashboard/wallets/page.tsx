'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { WalletCard } from '@/components/ui/WalletCard'
import { Modal } from '@/components/ui/Modal'

interface Wallet {
  id: string
  label: string
  status: string
  balanceDisplay: string
  address: string
}

import { useUIFlags } from '@/hooks/useUIFlags'

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const flags = useUIFlags()

  const load = useCallback(() => {
    api.get<Wallet[]>('/api/v1/wallets').then(setWallets).catch(() => {})
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
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Wallets</h2>
          <p className="text-surface/50 text-sm mt-1">Manage your USDT wallets</p>
        </div>
        <div className="flex items-center gap-3">
          {wallets.length < 10 && (
            <button
              onClick={() => setOpen(true)}
              className="bg-primary text-bg text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              + New Wallet
            </button>
          )}
        </div>
      </div>

      {wallets.length === 0 ? (
        <div className="bg-card rounded-xl border border-white/5 p-12 text-center">
          <p className="text-surface/40 mb-2">No wallets yet</p>
          <p className="text-surface/30 text-sm mb-6">Create a wallet to get started</p>
          <button
            onClick={() => setOpen(true)}
            className="bg-primary text-bg text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition"
          >
            Create First Wallet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {wallets.map(w => (
            <WalletCard key={w.id} wallet={w} onRefresh={load} />
          ))}
        </div>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Wallet">
        {error && <p className="text-danger text-sm mb-4 bg-danger/10 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-surface/60 mb-1">Wallet Label</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Main Wallet"
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface focus:outline-none focus:border-primary"
              required maxLength={100}
            />
          </div>
          {flags.show_wallet_notice && (
          <p className="text-xs text-warning bg-warning/10 p-3 rounded-lg">
            ⚠ This is a BlockCoin virtual wallet. Balances are simulated and not real USDT.
          </p>
          )}
          <button
            type="submit"
            className="w-full bg-primary text-bg font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition"
          >
            Create Wallet
          </button>
        </form>
      </Modal>
    </div>
  )
}
