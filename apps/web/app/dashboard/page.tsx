'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/services/api'
import { WalletCard } from '@/components/ui/WalletCard'
import Link from 'next/link'
import { unitsToDisplay } from '@blockcoin/shared'
import { ShimmerCards, ShimmerRows } from '@/components/ui/Shimmer'

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

const TX_LABEL: Record<string, string> = {
  CREDIT: 'Money Received',
  DEBIT: 'Money Sent',
  TRANSFER: 'Transfer',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)

  const loadWallets = useCallback(() => {
    api.get<Wallet[]>('/api/v1/wallets').then(setWallets).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get<Wallet[]>('/api/v1/wallets'),
      api.get<{ items: Tx[] }>('/api/v1/transactions?limit=5'),
    ]).then(([w, t]) => { setWallets(w); setTxs(t.items) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loadWallets])

  const totalBalance = wallets.reduce((sum, w) => {
    const [whole, frac = '000000'] = w.balanceDisplay.split('.')
    return sum + BigInt(whole + frac.padEnd(6, '0').slice(0, 6))
  }, 0n)

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero balance banner */}
      <div className="bg-gradient-to-b from-[#0d3d2c] to-bg px-5 pt-6 pb-8">
        <div className="mb-1">
          <p className="text-white/50 text-sm">Good day,</p>
          <h1 className="text-xl font-bold text-white">{user?.firstName} {user?.lastName}</h1>
        </div>
        <div className="mt-6 text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Total Portfolio</p>
          <p className="text-5xl font-bold font-mono text-white tracking-tight">
            {unitsToDisplay(totalBalance)}
          </p>
          <p className="text-primary font-semibold mt-1">USDT</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-3 mt-8">
          {[
            { href: '/dashboard/deposits', label: 'Deposit', icon: (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4" />
              </svg>
            )},
            { href: '/dashboard/wallets', label: 'Wallets', icon: (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            )},
            { href: '/dashboard/transactions', label: 'History', icon: (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            )},
            { href: '/dashboard/profile', label: 'Profile', icon: (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )},
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                {a.icon}
              </div>
              <span className="text-[11px] text-white/60 font-medium">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-6 pb-4">
        {/* Wallets section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-surface">My Wallets</h2>
            <Link href="/dashboard/wallets" className="text-xs text-primary font-medium">See all</Link>
          </div>
          {loading ? <ShimmerCards count={2} /> : wallets.length === 0 ? (
            <div className="bg-card rounded-2xl border border-white/5 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-surface/50 text-sm mb-4">No wallets yet</p>
              <Link href="/dashboard/wallets"
                className="bg-primary text-bg text-sm font-semibold px-6 py-2.5 rounded-xl inline-block active:scale-95 transition-transform">
                Create Wallet
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {wallets.slice(0, 2).map(w => (
                <WalletCard key={w.id} wallet={w} onRefresh={loadWallets} />
              ))}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-surface">Recent Activity</h2>
            <Link href="/dashboard/transactions" className="text-xs text-primary font-medium">See all</Link>
          </div>
          <div className="bg-card rounded-2xl border border-white/5 overflow-hidden">
            {loading ? <ShimmerRows rows={4} /> : txs.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-surface/40 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {txs.map(tx => (
                  <Link key={tx.id} href={`/dashboard/transactions/${tx.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'CREDIT' ? 'bg-primary/15' :
                      tx.type === 'DEBIT'  ? 'bg-danger/15' : 'bg-secondary/15'
                    }`}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                        className={tx.type === 'CREDIT' ? 'text-primary' : tx.type === 'DEBIT' ? 'text-danger' : 'text-secondary'}>
                        {tx.type === 'CREDIT'
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4" />
                          : tx.type === 'DEBIT'
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4m0 0l-4 4m4-4l4 4" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        }
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface">{TX_LABEL[tx.type] ?? tx.type}</p>
                      <p className="text-xs text-surface/40 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold font-mono ${tx.type === 'CREDIT' ? 'text-primary' : 'text-danger'}`}>
                        {tx.type === 'CREDIT' ? '+' : '-'}{tx.amountDisplay}
                      </p>
                      <p className="text-[10px] text-surface/30 mt-0.5">USDT</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
