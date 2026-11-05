'use client'
import Link from 'next/link'
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

const GRADIENTS = [
  'from-[#0f4c35] via-[#0d3d2c] to-[#0a2d20]',
  'from-[#1a2f5e] via-[#152548] to-[#0f1c38]',
  'from-[#3d1a5e] via-[#2d1248] to-[#1e0c30]',
  'from-[#3d2a0a] via-[#2d1f08] to-[#1e1405]',
]

function getGradient(id: string) {
  const n = id.charCodeAt(0) % GRADIENTS.length
  return GRADIENTS[n]
}

export function WalletCard({ wallet, onRefresh }: Props) {
  useWalletSocket(wallet.id, onRefresh)
  const suspended = wallet.status !== 'ACTIVE'
  const grad = getGradient(wallet.id)

  return (
    <div className={`relative rounded-2xl overflow-hidden ${suspended ? 'opacity-60' : ''}`}>
      {/* Card face */}
      <div className={`bg-gradient-to-br ${grad} p-5 border border-white/8`}>
        {/* Top row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">USDT Wallet</p>
            <p className="text-base font-semibold text-white mt-0.5 truncate max-w-[160px]">{wallet.label}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${
              suspended ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'
            }`}>
              {wallet.status}
            </span>
            {/* Chip icon */}
            <div className="w-8 h-6 rounded-[4px] bg-gradient-to-br from-yellow-300/30 to-yellow-500/20 border border-yellow-400/20 grid grid-cols-2 gap-px p-1">
              <div className="bg-yellow-400/30 rounded-[1px]" />
              <div className="bg-yellow-400/30 rounded-[1px]" />
              <div className="bg-yellow-400/30 rounded-[1px]" />
              <div className="bg-yellow-400/30 rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="mb-5">
          <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">Available Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">
              {wallet.balanceDisplay}
            </span>
            <span className="text-sm font-semibold text-primary">USDT</span>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-mono text-white/30 truncate max-w-[180px]">
            {wallet.address.slice(0, 8)}••••{wallet.address.slice(-6)}
          </p>
          <div className="flex gap-1">
            <div className="w-5 h-5 rounded-full bg-warning/60" />
            <div className="w-5 h-5 rounded-full bg-warning/30 -ml-2" />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!suspended ? (
        <div className="grid grid-cols-3 border-t border-white/5 bg-card">
          <Link
            href={`/dashboard/wallets/${wallet.id}`}
            className="flex flex-col items-center gap-1 py-3 text-surface/50 hover:text-primary hover:bg-primary/5 transition active:scale-95"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[10px] font-medium">Details</span>
          </Link>
          <Link
            href={`/dashboard/deposits?walletId=${wallet.id}`}
            className="flex flex-col items-center gap-1 py-3 text-surface/50 hover:text-primary hover:bg-primary/5 transition border-x border-white/5 active:scale-95"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4" />
            </svg>
            <span className="text-[10px] font-medium">Deposit</span>
          </Link>
          <Link
            href={`/dashboard/wallets/${wallet.id}?action=withdraw`}
            className="flex flex-col items-center gap-1 py-3 text-surface/50 hover:text-danger hover:bg-danger/5 transition active:scale-95"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4m0 0l-4 4m4-4l4 4" />
            </svg>
            <span className="text-[10px] font-medium">Withdraw</span>
          </Link>
        </div>
      ) : (
        <div className="py-3 text-center text-xs text-danger/60 bg-card border-t border-white/5">
          Wallet suspended
        </div>
      )}
    </div>
  )
}
