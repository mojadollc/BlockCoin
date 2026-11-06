'use client'
import { useEffect, useRef, useState } from 'react'

type CoinData = {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  sparkline: number[]
}

const COINS = [
  { id: 'bitcoin',     symbol: 'BTC', name: 'Bitcoin'  },
  { id: 'ethereum',    symbol: 'ETH', name: 'Ethereum' },
  { id: 'tether',      symbol: 'USDT',name: 'Tether'   },
  { id: 'tron',        symbol: 'TRX', name: 'TRON'     },
  { id: 'solana',      symbol: 'SOL', name: 'Solana'   },
  { id: 'ripple',      symbol: 'XRP', name: 'XRP'      },
]

const COLORS = ['#00C89B', '#2684FF', '#F5B942', '#EF5350', '#a78bfa', '#38bdf8']

function SparklineCanvas({ data, color, positive }: { data: number[]; color: string; positive: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    ctx.clearRect(0, 0, w, h)

    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * w,
      y: h - ((v - min) / range) * (h - 4) - 2,
    }))

    // Fill gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, color + '40')
    grad.addColorStop(1, color + '00')
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()
  }, [data, color])

  return <canvas ref={ref} width={120} height={40} className="w-full h-10" />
}

export function MarketChart() {
  const [coins, setCoins] = useState<CoinData[]>([])
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(true)
  const mainRef = useRef<HTMLCanvasElement>(null)

  const fetchData = async () => {
    try {
      const ids = COINS.map(c => c.id).join(',')
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      const mapped: CoinData[] = COINS.map(c => {
        const d = data.find((x: any) => x.id === c.id)
        return {
          id: c.id,
          symbol: c.symbol,
          name: c.name,
          price: d?.current_price ?? 0,
          change24h: d?.price_change_percentage_24h ?? 0,
          sparkline: d?.sparkline_in_7d?.price ?? [],
        }
      })
      setCoins(mapped)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 60_000)
    return () => clearInterval(t)
  }, [])

  // Draw main large chart
  useEffect(() => {
    const canvas = mainRef.current
    const coin = coins[selected]
    if (!canvas || !coin || coin.sparkline.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const data = coin.sparkline
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const color = COLORS[selected]

    ctx.clearRect(0, 0, w, h)

    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * w,
      y: h - ((v - min) / range) * (h - 20) - 10,
    }))

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Fill
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, color + '30')
    grad.addColorStop(1, color + '00')
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      const cp = { x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 }
      ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, cp.x, cp.y)
    }
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      const cp = { x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 }
      ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, cp.x, cp.y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    // Last point dot
    const last = pts[pts.length - 1]
    ctx.beginPath()
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.beginPath()
    ctx.arc(last.x, last.y, 7, 0, Math.PI * 2)
    ctx.fillStyle = color + '30'
    ctx.fill()
  }, [coins, selected])

  const coin = coins[selected]
  const pos = coin ? coin.change24h >= 0 : true
  const color = COLORS[selected]

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="absolute -inset-1 rounded-2xl blur-sm" style={{ background: `linear-gradient(135deg, ${color}30, #2684FF15)` }} />
      <div className="relative bg-card border border-white/8 rounded-2xl overflow-hidden shadow-2xl">

        {/* Top bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-sidebar/60">
          <span className="w-2.5 h-2.5 rounded-full bg-danger/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          <span className="ml-3 text-xs text-surface/20 font-mono">blockcoin.app — Live Market</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-primary/70 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            LIVE
          </span>
        </div>

        <div className="p-5">
          {/* Coin tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            {loading
              ? COINS.map((_, i) => <div key={i} className="h-8 w-20 rounded-lg bg-white/5 animate-pulse shrink-0" />)
              : coins.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(i)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selected === i
                      ? 'text-bg font-bold'
                      : 'bg-white/5 text-surface/50 hover:text-surface hover:bg-white/8'
                  }`}
                  style={selected === i ? { backgroundColor: COLORS[i] } : {}}
                >
                  {c.symbol}
                  <span className={`text-[10px] ${c.change24h >= 0 ? (selected === i ? 'text-bg/70' : 'text-primary') : (selected === i ? 'text-bg/70' : 'text-danger')}`}>
                    {c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(1)}%
                  </span>
                </button>
              ))
            }
          </div>

          {/* Price header */}
          {loading ? (
            <div className="mb-4 space-y-2">
              <div className="h-8 w-48 rounded bg-white/5 animate-pulse" />
              <div className="h-4 w-32 rounded bg-white/5 animate-pulse" />
            </div>
          ) : coin && (
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-xs text-surface/30 mb-1">{coin.name} · 7-day chart</p>
                <p className="text-3xl font-black font-mono tracking-tight" style={{ color }}>
                  ${coin.price < 1
                    ? coin.price.toFixed(4)
                    : coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-lg ${pos ? 'bg-primary/15 text-primary' : 'bg-danger/15 text-danger'}`}>
                <span>{pos ? '▲' : '▼'}</span>
                <span>{Math.abs(coin.change24h).toFixed(2)}% 24h</span>
              </div>
            </div>
          )}

          {/* Main chart */}
          <div className="relative h-40 mb-5">
            {loading ? (
              <div className="w-full h-full rounded-xl bg-white/5 animate-pulse" />
            ) : (
              <canvas ref={mainRef} width={800} height={160} className="w-full h-full" />
            )}
          </div>

          {/* Coin grid sparklines */}
          <div className="grid grid-cols-3 gap-2">
            {loading
              ? [...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)
              : coins.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(i)}
                  className={`rounded-xl p-2.5 border transition-all text-left ${
                    selected === i ? 'border-white/20 bg-white/5' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-surface/60">{c.symbol}</span>
                    <span className={`text-[9px] font-bold ${c.change24h >= 0 ? 'text-primary' : 'text-danger'}`}>
                      {c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(1)}%
                    </span>
                  </div>
                  <SparklineCanvas data={c.sparkline} color={COLORS[i]} positive={c.change24h >= 0} />
                </button>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
