'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/services/api'
import { WalletCard } from '@/components/ui/WalletCard'
import Link from 'next/link'
import { unitsToDisplay } from '@blockcoin/shared'

interface Wallet {
  id: string
  label: string
  status: string
  balanceDisplay: string
  address: string
}

interface Tx {
  id: string
  type: string
  amountDisplay: string
  status: string
  createdAt: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [txs, setTxs] = useState<Tx[]>([])

  const loadWallets = useCallback(() => {
    api.get<Wallet[]>('/api/v1/wallets').then(setWallets).catch(() => {})
  }, [])

  useEffect(() => {
    loadWallets()
    api.get<{ items: Tx[] }>('/api/v1/transactions?limit=5').then(d => setTxs(d.items)).catch(() => {})
  }, [loadWallets])

  const totalBalance = wallets.reduce((sum, w) => {
    const [whole, frac = '000000'] = w.balanceDisplay.split('.')
    return sum + BigInt(whole + frac.padEnd(6, '0').slice(0, 6))
  }, 0n)

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold">Welcome, {user?.firstName}</h2>
        <p className="text-surface/50 text-sm mt-1">Your BlockCoin wallet dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl p-6 border border-white/5">
          <p className="text-sm text-surface/50">Total Balance</p>
          <p className="text-3xl font-bold font-mono text-primary mt-2">{unitsToDisplay(totalBalance)}</p>
          <p className="text-xs text-surface/40 mt-1">USDT</p>
        </div>
        <div className="bg-card rounded-xl p-6 border border-white/5">
          <p className="text-sm text-surface/50">Wallets</p>
          <p className="text-3xl font-bold text-secondary mt-2">{wallets.length}</p>
          <p className="text-xs text-surface/40 mt-1">of 10 maximum</p>
        </div>
        <div className="bg-card rounded-xl p-6 border border-white/5">
          <p className="text-sm text-surface/50">Recent Transactions</p>
          <p className="text-3xl font-bold text-warning mt-2">{txs.length}</p>
          <p className="text-xs text-surface/40 mt-1">last 5 shown</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Wallets</h3>
        <Link href="/dashboard/wallets" className="text-sm text-primary hover:underline">View all →</Link>
      </div>

      {wallets.length === 0 ? (
        <div className="bg-card rounded-xl border border-white/5 p-8 text-center mb-8">
          <p className="text-surface/40 mb-4">No wallets yet</p>
          <Link href="/dashboard/wallets"
            className="bg-primary text-bg text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition">
            Create Your First Wallet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {wallets.slice(0, 3).map(w => (
            <WalletCard key={w.id} wallet={w} onRefresh={loadWallets} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Recent Transactions</h3>
        <Link href="/dashboard/transactions" className="text-sm text-primary hover:underline">View all →</Link>
      </div>

      <div className="bg-card rounded-xl border border-white/5">
        {txs.length === 0 ? (
          <p className="p-6 text-surface/40 text-sm">No transactions yet</p>
        ) : (
          <div className="divide-y divide-white/5">
            {txs.map(tx => (
              <Link key={tx.id} href={`/dashboard/transactions/${tx.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/2 transition">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    tx.type === 'CREDIT' ? 'bg-primary/20 text-primary' :
                    tx.type === 'DEBIT' ? 'bg-danger/20 text-danger' :
                    'bg-secondary/20 text-secondary'
                  }`}>
                    {tx.type === 'CREDIT' ? '↓' : tx.type === 'DEBIT' ? '↑' : '⇄'}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{tx.type}</p>
                    <p className="text-xs text-surface/40">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm font-semibold ${tx.type === 'CREDIT' ? 'text-primary' : 'text-danger'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{tx.amountDisplay} USDT
                  </p>
                  <p className="text-xs text-surface/40">{tx.status}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
