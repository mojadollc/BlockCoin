'use client'
import { useEffect, useRef, useState } from 'react'

type Coin = { symbol: string; price: number; change: number }

const COIN_IDS = [
  { id: 'tether',      symbol: 'USDT' },
  { id: 'bitcoin',     symbol: 'BTC'  },
  { id: 'ethereum',    symbol: 'ETH'  },
  { id: 'tron',        symbol: 'TRX'  },
  { id: 'binancecoin', symbol: 'BNB'  },
  { id: 'solana',      symbol: 'SOL'  },
  { id: 'ripple',      symbol: 'XRP'  },
  { id: 'cardano',     symbol: 'ADA'  },
]

export async function fetchTickerData(): Promise<Coin[]> {
  try {
    const ids = COIN_IDS.map(c => c.id).join(',')
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 60 } }
    )
    const data = await res.json()
    return COIN_IDS.map(c => ({
      symbol: c.symbol,
      price: data[c.id]?.usd ?? 0,
      change: data[c.id]?.usd_24h_change ?? 0,
    }))
  } catch {
    return []
  }
}

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
