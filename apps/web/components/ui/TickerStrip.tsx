'use client'
import { useEffect, useState } from 'react'
import { fetchTickerData } from '@/lib/marketData'
import type { TickerCoin as Coin } from '@/lib/marketData'

function fmtPrice(p: number) {
  if (p < 0.01) return p.toFixed(6)
  if (p < 1) return p.toFixed(4)
  return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function TickerStrip({ initialCoins = [] }: { initialCoins?: Coin[] }) {
  const [coins, setCoins] = useState<Coin[]>(initialCoins)

  useEffect(() => {
    // Only re-fetch if we didn't get server data
    if (initialCoins.length === 0) {
      fetchTickerData().then(setCoins)
    }
    const t = setInterval(() => fetchTickerData().then(setCoins), 60_000)
    return () => clearInterval(t)
  }, [])

  if (!coins.length) return (
    <div className="w-full bg-black/40 border-b border-white/5 h-7" />
  )

  const items = [...coins, ...coins]

  return (
    <div className="w-full overflow-hidden bg-black/40 border-b border-white/5 h-7 flex items-center">
      <div
        className="flex gap-8 whitespace-nowrap animate-ticker"
        style={{ willChange: 'transform' }}
      >
        {items.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-surface/50">{c.symbol}</span>
            <span className="text-surface/90">${fmtPrice(c.price)}</span>
            <span className={c.change >= 0 ? 'text-primary' : 'text-danger'}>
              {c.change >= 0 ? '▲' : '▼'}{Math.abs(c.change).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
