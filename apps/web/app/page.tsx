import Link from 'next/link'
import { MarketChart } from '@/components/ui/MarketChart'
import { TickerStrip } from '@/components/ui/TickerStrip'

const FEATURES = [
  {
    icon: '◈',
    title: 'USDT Wallets',
    desc: 'Create and manage multiple USDT wallets per account. Full ledger tracking, real-time balance updates, and instant transaction history.',
    accent: 'primary',
  },
  {
    icon: '⚙',
    title: 'Transaction Engine',
    desc: 'Execute CREDIT, DEBIT, and TRANSFER operations with configurable processing, expiry timers, and real-time status tracking.',
    accent: 'secondary',
  },
  {
    icon: '🛡',
    title: 'Security Testing',
    desc: 'Run 20+ security scenarios against your wallets. Identify vulnerabilities before they become problems.',
    accent: 'warning',
  },
  {
    icon: '⛓',
    title: 'Blockchain Integration',
    desc: 'Connect to Ethereum Sepolia and TRON Nile networks. Submit on-chain transactions and verify them on public explorers.',
    accent: 'secondary',
  },
  {
    icon: '📋',
    title: 'Immutable Audit Logs',
    desc: 'Every action, balance change, and transaction is permanently recorded. Full accountability with actor tracking.',
    accent: 'primary',
  },
]

const STEPS = [
  { step: '01', title: 'Create Your Account', desc: 'Sign up in seconds. Your isolated environment is ready instantly.' },
  { step: '02', title: 'Set Up Your Wallets', desc: 'Create USDT wallets. Each has its own ledger, address, and real-time balance tracking.' },
  { step: '03', title: 'Execute Transactions', desc: 'Trigger deposits, withdrawals, and transfers. Watch status flow in real time.' },
  { step: '04', title: 'Monitor & Secure', desc: 'Run security scenarios against your wallets. Get detailed pass/fail reports with full breakdowns.' },
]

const STATS = [
  { value: '20+', label: 'Security Scenarios' },
  { value: '2', label: 'Blockchain Networks' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '500+', label: 'Active Users' },
]

const TESTIMONIALS = [
  {
    name: 'Marcus T.',
    role: 'Business Owner',
    avatar: 'MT',
    text: 'BlockCoin made managing our USDT payments incredibly simple. We handle thousands of transactions every day and everything runs smoothly. The real-time balance tracking gives us full peace of mind.',
  },
  {
    name: 'Priya S.',
    role: 'E-commerce Entrepreneur',
    avatar: 'PS',
    text: 'I was up and running within minutes. Managing multiple wallets and tracking every transaction in one place has completely transformed how I handle my finances. Highly recommend.',
  },
  {
    name: 'James K.',
    role: 'Crypto Investor',
    avatar: 'JK',
    text: 'The platform is clean, fast, and reliable. I can monitor all my USDT wallets and transaction history in real time. It feels like a professional banking experience for crypto.',
  },
]

const PLANS = [
  {
    name: 'Pro',
    price: '$29',
    sub: 'per month',
    badge: 'Most Popular',
    features: ['10 wallets', 'Unlimited transactions', 'All 20+ security scenarios', 'Blockchain integration', 'Priority support', 'Audit logs'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    sub: 'contact us',
    badge: null,
    features: ['Unlimited wallets', 'Custom scenarios', 'Dedicated environment', 'SLA guarantee', 'White-label option', 'API access'],
    cta: 'Contact Sales',
    highlight: false,
  },
]

const accentBg: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  warning: 'bg-warning/10 text-warning',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-surface overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-bg/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="text-base font-bold tracking-tight hover:text-primary transition-colors">BlockCoin</Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-surface/50">
            <a href="#features" className="hover:text-surface transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-surface transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-surface transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-surface transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-surface/60 hover:text-surface transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
              Sign In
            </Link>
            <Link href="/register" className="text-sm bg-primary text-bg font-bold px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="fixed top-16 left-0 right-0 z-40">
        <TickerStrip />
      </div>

      {/* Hero */}
      <section className="relative pt-44 pb-28 px-5 flex flex-col items-center text-center overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-72 h-72 bg-secondary/6 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-warning/4 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <MarketChart />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link href="/register"
              className="w-full sm:w-auto bg-primary text-bg font-bold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 text-sm">
              Get Started Free
            </Link>
            <a href="#how-it-works"
              className="w-full sm:w-auto bg-white/5 border border-white/8 text-surface/80 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm">
              See How It Works →
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-4xl font-black text-primary tabular-nums">{s.value}</p>
                <p className="text-xs text-surface/40 mt-1.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">Everything You Need to Manage USDT</h2>
            <p className="text-surface/40 max-w-lg mx-auto text-sm leading-relaxed">
              From wallet creation to live blockchain transactions — every tool your team needs, in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className="group relative bg-card border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg mb-5 ${accentBg[f.accent]}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-sm mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-xs text-surface/40 leading-relaxed">{f.desc}</p>
                {i === 0 && (
                  <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-28 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar/0 via-sidebar/30 to-sidebar/0 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-secondary text-xs font-bold uppercase tracking-[0.2em] mb-4">Simple Setup</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">Up and Running in Minutes</h2>
            <p className="text-surface/40 max-w-sm mx-auto text-sm">No complex configuration. No waiting.</p>
          </div>
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-7 top-7 bottom-7 w-px bg-gradient-to-b from-primary/30 via-secondary/20 to-transparent hidden sm:block" />
            <div className="space-y-5">
              {STEPS.map((s, i) => (
                <div key={s.step} className="flex gap-5 items-start group">
                  <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-card border border-white/8 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                    <span className="text-primary font-black text-sm">{s.step}</span>
                  </div>
                  <div className="flex-1 bg-card border border-white/5 rounded-2xl p-5 group-hover:border-white/10 transition-colors">
                    <h3 className="font-bold text-sm mb-1.5">{s.title}</h3>
                    <p className="text-surface/40 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-28 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-warning text-xs font-bold uppercase tracking-[0.2em] mb-4">Customer Feedback</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">What Our Customers Are Saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="bg-card border border-white/5 rounded-2xl p-6 flex flex-col gap-5 hover:border-white/10 transition-colors">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span key={j} className="text-warning text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-surface/60 leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-primary/20 text-primary' : i === 1 ? 'bg-secondary/20 text-secondary' : 'bg-warning/20 text-warning'}`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-surface/30">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar/0 via-sidebar/30 to-sidebar/0 pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-surface/40 max-w-sm mx-auto text-sm">No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PLANS.map(p => (
              <div key={p.name} className={`relative rounded-2xl p-px ${p.highlight ? 'bg-gradient-to-b from-primary/40 to-secondary/20' : 'bg-white/5'}`}>
                <div className="bg-card rounded-2xl p-7 flex flex-col h-full">
                  {p.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-bg text-xs font-black px-4 py-1 rounded-full">
                      {p.badge}
                    </span>
                  )}
                  <div className="mb-7">
                    <p className="text-xs text-surface/40 font-semibold uppercase tracking-wider mb-3">{p.name}</p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-5xl font-black tracking-tight">{p.price}</span>
                      <span className="text-surface/30 text-sm mb-1.5">{p.sub}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-surface/60">
                        <span className="text-primary shrink-0 font-bold">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register"
                    className={`text-center font-bold py-3 rounded-xl transition-all text-sm ${p.highlight
                      ? 'bg-primary text-bg hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20'
                      : 'bg-white/5 border border-white/10 text-surface hover:bg-white/10'}`}>
                    {p.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">Ready to Get Started?</h2>
          <p className="text-surface/40 mb-10 text-sm leading-relaxed">
            Join hundreds of customers already using BlockCoin to manage USDT at scale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register"
              className="w-full sm:w-auto bg-primary text-bg font-black px-10 py-4 rounded-xl hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/20 text-sm">
              Create Your Account
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto border border-white/10 text-surface/70 font-semibold px-10 py-4 rounded-xl hover:bg-white/5 transition-colors text-sm">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="font-bold text-sm hover:text-primary transition-colors">BlockCoin</Link>
          <p className="text-xs text-surface/20">
            © {new Date().getFullYear()} BlockCoin. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-surface/30">
            <Link href="/login" className="hover:text-surface transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-surface transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
