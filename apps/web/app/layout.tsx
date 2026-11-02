import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BlockCoin USDT Lab',
  description: 'Private Wallet Simulation & Security Testing Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
