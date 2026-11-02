'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/services/api'
import { useWalletSocket } from '@/hooks/useWalletSocket'

interface Wallet {
  id: string
  label: string
  status: string
  balanceDisplay: string
  address: string
}

interface Props {
  wallet: Wallet
  onRefresh: () => void
}

export function WalletCard({ wallet, onRefresh }: Props) {
  useWalletSocket(wallet.id, onRefresh)

  return (
    <div className={`bg-card rounded-xl border p-6 flex flex-col gap-4 ${
      wallet.status === 'ACTIVE' ? 'border-white/5' : 'border-danger/20 opacity-70'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface/50">BlockCoin Virtual Wallet</p>
          <h3 className="font-semibold mt-0.5">{wallet.label}</h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          wallet.status === 'ACTIVE' ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'
        }`}>
          {wallet.status}
        </span>
      </div>

      <div>
        <p className="text-3xl font-bold font-mono text-primary">
          {wallet.balanceDisplay}
        </p>
        <p className="text-xs text-surface/40 mt-1">USDT (BlockCoin Internal)</p>
      </div>

      <div className="text-xs text-surface/30 font-mono truncate">
        {wallet.address}
      </div>

      <div className="flex gap-2 pt-2 border-t border-white/5">
        <Link
          href={`/dashboard/wallets/${wallet.id}`}
          className="flex-1 text-center text-xs py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
        >
          Manage
        </Link>
        <Link
          href={`/dashboard/wallets/${wallet.id}?action=deposit`}
          className="flex-1 text-center text-xs py-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition"
        >
          Deposit
        </Link>
        <Link
          href={`/dashboard/wallets/${wallet.id}?action=withdraw`}
          className="flex-1 text-center text-xs py-2 rounded-lg bg-white/5 text-surface/60 hover:bg-white/10 transition"
        >
          Withdraw
        </Link>
      </div>
    </div>
  )
}
