import type { MarketCoinData } from '@/components/ui/MarketChart'

const MARKET_IDS = [
  { id: 'bitcoin',  symbol: 'BTC',  name: 'Bitcoin'  },
  { id: 'ethereum', symbol: 'ETH',  name: 'Ethereum' },
  { id: 'tether',   symbol: 'USDT', name: 'Tether'   },
  { id: 'tron',     symbol: 'TRX',  name: 'TRON'     },
  { id: 'solana',   symbol: 'SOL',  name: 'Solana'   },
  { id: 'ripple',   symbol: 'XRP',  name: 'XRP'      },
]

const TICKER_IDS = [
  { id: 'tether',      symbol: 'USDT' },
  { id: 'bitcoin',     symbol: 'BTC'  },
  { id: 'ethereum',    symbol: 'ETH'  },
  { id: 'tron',        symbol: 'TRX'  },
  { id: 'binancecoin', symbol: 'BNB'  },
  { id: 'solana',      symbol: 'SOL'  },
  { id: 'ripple',      symbol: 'XRP'  },
  { id: 'cardano',     symbol: 'ADA'  },
]

export type TickerCoin = { symbol: string; price: number; change: number }

export async function fetchMarketData(): Promise<MarketCoinData[]> {
  try {
    const ids = MARKET_IDS.map(c => c.id).join(',')
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`,
      { next: { revalidate: 60 } }
    )
    const data = await res.json()
    return MARKET_IDS.map(c => {
      const d = data.find((x: any) => x.id === c.id)
      return {
        id: c.id, symbol: c.symbol, name: c.name,
        price: d?.current_price ?? 0,
        change24h: d?.price_change_percentage_24h ?? 0,
        sparkline: d?.sparkline_in_7d?.price ?? [],
      }
    })
  } catch {
    return []
  }
}

export async function fetchTickerData(): Promise<TickerCoin[]> {
  try {
    const ids = TICKER_IDS.map(c => c.id).join(',')
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 60 } }
    )
    const data = await res.json()
    return TICKER_IDS.map(c => ({
      symbol: c.symbol,
      price: data[c.id]?.usd ?? 0,
      change: data[c.id]?.usd_24h_change ?? 0,
    }))
  } catch {
    return []
  }
}
