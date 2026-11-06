import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PWAInstallPrompt } from '@/components/ui/PWAInstallPrompt'

const SITE_URL = 'https://blockcoin.beegoo.app'
const SITE_NAME = 'BlockCoin'
const TITLE = 'BlockCoin — Professional USDT Wallet & Crypto Trading Platform'
const DESCRIPTION = 'BlockCoin is a professional USDT wallet platform for sending, receiving, and managing Tether (USDT) across multiple wallets. Real-time crypto market tracking, live blockchain integration on Ethereum and TRON, full transaction history, and enterprise-grade security testing.'
const KEYWORDS = [
  'USDT wallet', 'Tether wallet', 'crypto wallet', 'cryptocurrency wallet',
  'USDT trading platform', 'crypto trading platform', 'blockchain wallet',
  'send USDT', 'receive USDT', 'USDT transfer', 'USDT balance tracker',
  'Ethereum USDT', 'TRON USDT', 'TRC20 wallet', 'ERC20 wallet',
  'crypto portfolio tracker', 'real-time crypto prices', 'live crypto market',
  'Bitcoin price', 'Ethereum price', 'crypto market cap',
  'digital asset management', 'stablecoin wallet', 'DeFi wallet',
  'blockchain transaction tracker', 'crypto payment platform',
  'USDT deposit', 'USDT withdrawal', 'crypto ledger',
  'BlockCoin', 'blockcoin.beegoo.app',
].join(', ')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: `${SITE_URL}/icon-512.png`, width: 512, height: 512, alt: 'BlockCoin — USDT Wallet Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/icon-512.png`],
    creator: '@blockcoin',
  },
  alternates: { canonical: SITE_URL },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#101820',
    'msapplication-tap-highlight': 'no',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#00C89B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        {children}
        <PWAInstallPrompt />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FinancialService',
            name: 'BlockCoin',
            url: 'https://blockcoin.beegoo.app',
            logo: 'https://blockcoin.beegoo.app/icon-512.png',
            description: 'Professional USDT wallet and crypto trading platform. Send, receive and manage Tether (USDT) with real-time blockchain integration on Ethereum and TRON networks.',
            serviceType: 'Cryptocurrency Wallet Platform',
            areaServed: 'Worldwide',
            availableChannel: { '@type': 'ServiceChannel', serviceUrl: 'https://blockcoin.beegoo.app' },
            sameAs: ['https://blockcoin.beegoo.app'],
          }) }}
        />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {})
            })
          }
        `}} />
      </body>
    </html>
  )
}
