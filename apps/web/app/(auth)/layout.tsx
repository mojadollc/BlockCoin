import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#0d3d2c]/80 to-transparent pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        {/* Clickable logo */}
        <Link href="/" className="text-center mb-8 group">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 transition">
            <span className="text-3xl font-bold text-primary">₮</span>
          </div>
          <h1 className="text-2xl font-bold text-surface group-hover:text-primary transition">BlockCoin</h1>
          <p className="text-sm text-surface/40 mt-1">USDT Wallet Platform</p>
        </Link>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
