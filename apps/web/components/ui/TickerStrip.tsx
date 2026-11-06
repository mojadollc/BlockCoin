'use client'
import { useEffect, useRef, useState } from 'react'

type Coin = { symbol: string; price: number; change: number }

const COINS = [
  { id: 'tether',        symbol: 'USDT' },
  { id: 'bitcoin',       symbol: 'BTC'  },
  { id: 'ethereum',      symbol: 'ETH'  },
  { id: 'tron',          symbol: 'TRX'  },
  { id: 'binancecoin',   symbol: 'BNB'  },
  { id: 'solana',        symbol: 'SOL'  },
  { id: 'ripple',        symbol: 'XRP'  },
  { id: 'cardano',       symbol: 'ADA'  },
]

export function TickerStrip() {
  const [coins, setCoins] = useState<Coin[]>([])
  const trackRef = useRef<HTMLDivElement>(null)

  const fetchPrices = async () => {
    try {
      const ids = COINS.map(c => c.id).join(',')
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      setCoins(COINS.map(c => ({
        symbol: c.symbol,
        price: data[c.id]?.usd ?? 0,
        change: data[c.id]?.usd_24h_change ?? 0,
      })))
    } catch {}
  }

  useEffect(() => {
    fetchPrices()
    const t = setInterval(fetchPrices, 60_000)
    return () => clearInterval(t)
  }, [])

  if (!coins.length) return null

  const items = [...coins, ...coins] // duplicate for seamless loop

  return (
    <div className="w-full overflow-hidden bg-black/40 border-b border-white/5 h-7 flex items-center">
      <div
        ref={trackRef}
        className="flex gap-8 whitespace-nowrap animate-ticker"
        style={{ willChange: 'transform' }}
      >
        {items.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-surface/50">{c.symbol}</span>
            <span className="text-surface/90">
              ${c.price < 0.01
                ? c.price.toFixed(6)
                : c.price < 1
                ? c.price.toFixed(4)
                : c.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={c.change >= 0 ? 'text-primary' : 'text-danger'}>
              {c.change >= 0 ? '▲' : '▼'}{Math.abs(c.change).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
