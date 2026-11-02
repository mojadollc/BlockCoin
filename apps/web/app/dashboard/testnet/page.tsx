'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'
import { EnvBadge } from '@/components/ui/Badge'
import Link from 'next/link'

interface TestnetTx {
  id: string
  network: string
  txHash: string
  fromAddress: string
  toAddress: string
  amountUnits: string
  tokenSymbol: string
  blockNumber: string | null
  confirmations: number
  status: string
  createdAt: string
}

const NETWORKS = [
  {
    id: 'sepolia',
    label: 'Ethereum Sepolia',
    icon: '⟠',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
    explorer: 'https://sepolia.etherscan.io/tx/',
  },
  {
    id: 'tron-nile',
    label: 'TRON Nile',
    icon: '◈',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    explorer: 'https://nile.tronscan.org/#/transaction/',
  },
]

export default function TestnetPage() {
  const [txs, setTxs] = useState<TestnetTx[]>([])
  const [total, setTotal] = useState(0)
  const [networkFilter, setNetworkFilter] = useState('')

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: '20' })
    if (networkFilter) params.set('network', networkFilter)
    api.get<{ items: TestnetTx[]; total: number }>(`/api/v1/testnet/transactions?${params}`)
      .then(d => { setTxs(d.items); setTotal(d.total) })
      .catch(() => {})
  }, [networkFilter])

  useEffect(() => { load() }, [load])

  function formatAmount(units: string, symbol: string) {
    const n = BigInt(units)
    const str = n.toString().padStart(7, '0')
    return `${str.slice(0, -6)}.${str.slice(-6)} ${symbol}`
  }

  const explorerUrl = (tx: TestnetTx) => {
    const net = NETWORKS.find(n => n.id === tx.network.toLowerCase().replace('_', '-'))
    return net ? `${net.explorer}${tx.txHash}` : '#'
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Blockchain</h2>
          <p className="text-surface/50 text-sm mt-1">On-chain operations via Sepolia and TRON Nile networks</p>
        </div>
        <EnvBadge env="TESTNET" />
      </div>

      {/* Network cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {NETWORKS.map(net => (
          <Link
            key={net.id}
            href={`/dashboard/testnet/${net.id}`}
            className={`bg-card rounded-xl border ${net.border} p-6 hover:bg-white/2 transition`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-2xl ${net.color}`}>{net.icon}</span>
              <div>
                <h3 className="font-semibold">{net.label}</h3>
                <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">Live</span>
              </div>
            </div>
            <p className="text-sm text-surface/50">
              Connect a testnet wallet to read balances, submit real testnet transactions, and verify on-chain.
            </p>
            <p className={`text-sm font-medium mt-3 ${net.color}`}>Open →</p>
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 mb-8">
        <p className="text-sm text-secondary font-semibold mb-1">⛓ Blockchain Network</p>
        <p className="text-xs text-surface/60">
          Transactions on this page are real blockchain operations. Transaction hashes can be independently verified on public blockchain explorers.
        </p>
      </div>

      {/* Transaction history */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Testnet Transaction History</h3>
        <div className="flex gap-2">
          {[['', 'All'], ['sepolia', 'Sepolia'], ['tron-nile', 'TRON Nile']].map(([v, l]) => (
            <button key={v} onClick={() => setNetworkFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${networkFilter === v ? 'bg-secondary text-bg' : 'bg-white/5 text-surface/60 hover:bg-white/10'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-white/5">
        {txs.length === 0 ? (
          <p className="p-8 text-center text-surface/40">No testnet transactions yet</p>
        ) : (
          <div className="divide-y divide-white/5">
            {txs.map(tx => {
              const net = NETWORKS.find(n => n.id === tx.network.toLowerCase().replace('_', '-'))
              return (
                <div key={tx.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${net?.color ?? 'text-surface/60'}`}>{net?.icon ?? '◈'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded">
                            {tx.network.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tx.status === 'CONFIRMED' ? 'bg-primary/20 text-primary' :
                            tx.status === 'FAILED' ? 'bg-danger/20 text-danger' :
                            'bg-warning/20 text-warning'
                          }`}>{tx.status}</span>
                        </div>
                        <p className="font-mono text-xs text-surface/50 mt-1 break-all">
                          {tx.txHash.slice(0, 20)}…{tx.txHash.slice(-8)}
                        </p>
                        <p className="text-xs text-surface/30 mt-0.5">
                          {new Date(tx.createdAt).toLocaleString()}
                          {tx.blockNumber && ` · Block ${tx.blockNumber}`}
                          {tx.confirmations > 0 && ` · ${tx.confirmations} confirmations`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-semibold text-secondary">
                        {formatAmount(tx.amountUnits, tx.tokenSymbol)}
                      </p>
                      <a
                        href={explorerUrl(tx)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-secondary/60 hover:text-secondary mt-1 inline-block"
                      >
                        Verify on explorer ↗
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
