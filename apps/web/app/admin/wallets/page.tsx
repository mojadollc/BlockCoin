'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { unitsToDisplay } from '@blockcoin/shared'
import { ShimmerTable } from '@/components/ui/Shimmer'
import { usePermission } from '@/hooks/usePermission'

interface Wallet {
  id: string
  label: string
  status: string
  createdAt: string
  user: { email: string; firstName: string; lastName: string }
  ledgerAccount: { balanceUnits: string } | null
}

export default function AdminWalletsPage() {
  const { canWrite } = usePermission('wallets')
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [adjustWallet, setAdjustWallet] = useState<Wallet | null>(null)
  const [form, setForm] = useState({ amountDisplay: '', type: 'CREDIT', description: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get<{ items: Wallet[]; total: number }>(`/api/v1/admin/wallets?page=${page}&limit=20`)
      .then(d => { setWallets(d.items); setTotal(d.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault()
    if (!adjustWallet) return
    setMsg('')
    try {
      const res = await api.post<{ balanceDisplay: string }>(`/api/v1/admin/wallets/${adjustWallet.id}/adjust`, form)
      setMsg(`Done. New balance: ${res.balanceDisplay} USDT`)
      load()
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Failed')
    }
  }

  const columns = [
    { key: 'label', header: 'Label' },
    { key: 'user', header: 'Owner', render: (w: Wallet) => w.user.email },
    { key: 'balance', header: 'Balance (USDT)', render: (w: Wallet) => (
      <span className="font-mono text-primary">
        {w.ledgerAccount ? unitsToDisplay(BigInt(w.ledgerAccount.balanceUnits)) : '0.000000'}
      </span>
    )},
    { key: 'status', header: 'Status', render: (w: Wallet) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${w.status === 'ACTIVE' ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>
        {w.status}
      </span>
    )},
    { key: 'actions', header: '', render: (w: Wallet) => (
      <div className="flex gap-2">
        {canWrite ? (
          <>
            <button onClick={() => { setAdjustWallet(w); setMsg('') }} className="text-xs text-secondary hover:underline">
              Adjust Balance
            </button>
            <button
              onClick={async () => {
                const ep = w.status === 'ACTIVE' ? `/api/v1/admin/wallets/${w.id}/suspend` : `/api/v1/admin/wallets/${w.id}/activate`
                await api.post(ep).catch(() => {})
                load()
              }}
              className="text-xs text-warning hover:underline"
            >
              {w.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
            </button>
          </>
        ) : (
          <span className="text-xs text-surface/30 italic">View only</span>
        )}
      </div>
    )},
  ]

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Virtual Wallets</h2>

      <div className="bg-card rounded-xl border border-white/5">
        {loading ? <ShimmerTable rows={8} /> : <Table columns={columns} data={wallets} emptyMessage="No wallets found" />}
        <Pagination page={page} limit={20} total={total} onPage={setPage} />
      </div>

      <Modal isOpen={!!adjustWallet} onClose={() => { setAdjustWallet(null); setMsg('') }} title={`Adjust Balance — ${adjustWallet?.label}`}>
        {msg && <p className={`text-sm mb-4 p-3 rounded-lg ${msg.startsWith('Done') ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>{msg}</p>}
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="block text-sm text-surface/60 mb-1">Amount (USDT)</label>
            <input
              value={form.amountDisplay}
              onChange={e => setForm(f => ({ ...f, amountDisplay: e.target.value }))}
              placeholder="0.000000"
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface font-mono focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-surface/60 mb-1">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary"
            >
              <option value="CREDIT">CREDIT (add)</option>
              <option value="DEBIT">DEBIT (subtract)</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-surface/60 mb-1">Description</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2 text-surface focus:outline-none focus:border-primary"
              required
            />
          </div>
          <p className="text-xs text-warning bg-warning/10 p-2 rounded">
            ⚠ This adjustment will be recorded in the audit log.
          </p>
          <button type="submit" className="w-full bg-primary text-bg font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition">
            Apply Adjustment
          </button>
        </form>
      </Modal>
    </div>
  )
}
