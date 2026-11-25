import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign In — BlockCoin USDT Wallet',
  description: 'Sign in to your BlockCoin account to manage your USDT wallets, track crypto balances, and execute blockchain transactions.',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-surface flex overflow-hidden">

      {/* ── Left panel — branding (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden">

        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f18] via-bg to-[#0d1e2e]" />

        {/* Glow orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/8 rounded-full blur-[100px] animate-pulse-slow2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Floating grid dots */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #F4F7FA 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating cards — decorative */}
        <div className="absolute top-[18%] right-[8%] w-52 animate-float">
          <div className="bg-card/80 backdrop-blur-sm border border-white/8 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-sm font-black">₮</span>
              </div>
              <div>
                <p className="text-xs font-bold">USDT Balance</p>
                <p className="text-xs text-surface/30">Main Wallet</p>
              </div>
            </div>
            <p className="text-2xl font-black text-primary tabular-nums">$12,450.00</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-xs text-primary/70">↑ 2.4%</span>
              <span className="text-xs text-surface/30">today</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-[22%] left-[8%] w-48 animate-float2">
          <div className="bg-card/80 backdrop-blur-sm border border-white/8 rounded-2xl p-4 shadow-2xl">
            <p className="text-xs text-surface/40 mb-2">Recent Transaction</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2684FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              </div>
              <div>
                <p className="text-xs font-bold">+ 500 USDT</p>
                <p className="text-xs text-surface/30">Deposit • just now</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-[52%] right-[5%] w-44 animate-float3">
          <div className="bg-card/80 backdrop-blur-sm border border-white/8 rounded-2xl p-3.5 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-surface/40">Security</p>
              <span className="text-xs text-primary font-bold">Active</span>
            </div>
            <div className="flex gap-1">
              {[100, 100, 100, 100, 60].map((w, i) => (
                <div key={i} className="h-1 rounded-full flex-1" style={{ background: i < 4 ? '#00C89B' : '#00C89B40' }} />
              ))}
            </div>
            <p className="text-xs text-surface/30 mt-1.5">Strong protection</p>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:bg-primary/30 transition-all">
              <span className="text-xl font-black text-primary">₮</span>
            </div>
            <span className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">BlockCoin</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-sm">
          <h2 className="text-4xl font-black tracking-tight leading-[1.1] mb-4">
            The professional<br />
            <span className="text-primary">USDT platform</span><br />
            you can trust.
          </h2>
          <p className="text-surface/40 text-sm leading-relaxed">
            Manage wallets, execute transactions, and monitor your crypto portfolio — all in one secure place.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            {[
              { icon: '🔒', label: 'Bank-grade security' },
              { icon: '⚡', label: 'Real-time updates' },
              { icon: '⛓', label: 'Blockchain verified' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2">
                <span className="text-sm">{f.icon}</span>
                <span className="text-xs text-surface/50 font-semibold">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['MT', 'PS', 'JK', 'AR'].map((a, i) => (
                <div key={a} className="w-8 h-8 rounded-full border-2 border-bg flex items-center justify-center text-xs font-black"
                  style={{ background: ['#00C89B30', '#2684FF30', '#F5B94230', '#00C89B20'][i], color: ['#00C89B', '#2684FF', '#F5B942', '#00C89B'][i] }}>
                  {a}
                </div>
              ))}
            </div>
            <p className="text-xs text-surface/40">
              <span className="text-surface/70 font-bold">500+</span> users trust BlockCoin
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 relative">

        {/* Mobile background */}
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-primary/6 rounded-full blur-[100px]" />
        </div>

        {/* Mobile logo */}
        <Link href="/" className="lg:hidden flex flex-col items-center mb-8 group relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-all">
            <span className="text-2xl font-black text-primary">₮</span>
          </div>
          <span className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">BlockCoin</span>
        </Link>

        <div className="w-full max-w-[400px] relative z-10">
          {children}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes pulse-slow2 {
          0%, 100% { opacity: 0.4; transform: scale(1.05); }
          50% { opacity: 0.8; transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(-8px) rotate(1deg); }
          50% { transform: translateY(4px) rotate(-1deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(4px) rotate(0.5deg); }
          50% { transform: translateY(-8px) rotate(-0.5deg); }
        }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        .animate-pulse-slow2 { animation: pulse-slow2 8s ease-in-out infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float2 { animation: float2 7s ease-in-out infinite; }
        .animate-float3 { animation: float3 5s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
