import Link from 'next/link'

const FEATURES = [
  {
    icon: '◈',
    color: 'text-primary bg-primary/10',
    title: 'Virtual USDT Wallets',
    desc: 'Create up to 10 isolated virtual wallets per account. Simulate real USDT balances with full ledger tracking and instant balance updates.',
  },
  {
    icon: '⚙',
    color: 'text-secondary bg-secondary/10',
    title: 'Transaction Simulation Engine',
    desc: 'Run CREDIT, DEBIT, and TRANSFER simulations with configurable delays, expiry timers, and real-time status progression.',
  },
  {
    icon: '🛡',
    color: 'text-warning bg-warning/10',
    title: 'Security Simulator',
    desc: 'Test wallet behavior under 20+ security scenarios — balance spoofing, pending manipulation, sync attacks, and more.',
  },
  {
    icon: '⛓',
    color: 'text-secondary bg-secondary/10',
    title: 'Live Testnet Integration',
    desc: 'Connect to Ethereum Sepolia and TRON Nile testnets. Submit real on-chain transactions and verify them on public explorers.',
  },
  {
    icon: '📋',
    color: 'text-primary bg-primary/10',
    title: 'Immutable Audit Logs',
    desc: 'Every admin action, balance adjustment, and simulation is permanently recorded. Full accountability with actor tracking.',
  },
  {
    icon: '⊞',
    color: 'text-warning bg-warning/10',
    title: 'Admin Control Panel',
    desc: 'Manage users, wallets, and simulations from a powerful admin dashboard. Adjust balances, force statuses, and run security reports.',
  },
]

const STEPS = [
  { step: '01', title: 'Create Your Account', desc: 'Sign up in seconds. No credit card, no KYC. Your isolated environment is ready instantly.' },
  { step: '02', title: 'Spin Up Virtual Wallets', desc: 'Create up to 10 USDT wallets. Each has its own ledger, address, and real-time balance tracking.' },
  { step: '03', title: 'Run Simulations', desc: 'Trigger deposits, withdrawals, and transfers with custom delays. Watch status flow from PENDING to COMPLETED.' },
  { step: '04', title: 'Test Security Scenarios', desc: 'Run pre-built attack scenarios against your wallets. Get pass/fail reports with detailed check breakdowns.' },
]

const STATS = [
  { value: '20+', label: 'Security Scenarios' },
  { value: '2', label: 'Testnet Networks' },
  { value: '100%', label: 'Isolated Environment' },
  { value: '∞', label: 'Simulations' },
]

const TESTIMONIALS = [
  {
    name: 'Marcus T.',
    role: 'Blockchain Developer',
    avatar: 'MT',
    color: 'bg-primary/20 text-primary',
    text: 'BlockCoin Lab saved us weeks of testnet faucet hunting. We simulate thousands of USDT transactions daily without touching real funds. The security simulator caught 3 critical edge cases before we went live.',
  },
  {
    name: 'Priya S.',
    role: 'DeFi QA Engineer',
    avatar: 'PS',
    color: 'bg-secondary/20 text-secondary',
    text: 'The admin panel is incredibly powerful. Being able to force simulation statuses and adjust balances on the fly makes integration testing so much faster. The audit log gives us full traceability.',
  },
  {
    name: 'James K.',
    role: 'Fintech Startup CTO',
    avatar: 'JK',
    color: 'bg-warning/20 text-warning',
    text: "We use BlockCoin Lab to demo our payment product to investors. It looks and behaves exactly like a real USDT wallet — without the compliance headache. Our investors can't tell the difference.",
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    sub: 'Forever',
    color: 'border-white/10',
    badge: null,
    features: ['3 virtual wallets', '50 simulations/month', 'Basic security scenarios', 'Community support'],
    cta: 'Get Started',
    ctaStyle: 'bg-white/5 text-surface hover:bg-white/10',
  },
  {
    name: 'Pro',
    price: '$29',
    sub: 'per month',
    color: 'border-primary/40',
    badge: 'Most Popular',
    features: ['10 virtual wallets', 'Unlimited simulations', 'All 20+ security scenarios', 'Testnet integration', 'Priority support', 'Audit logs'],
    cta: 'Start Free Trial',
    ctaStyle: 'bg-primary text-bg hover:bg-primary/90',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    sub: 'contact us',
    color: 'border-white/10',
    badge: null,
    features: ['Unlimited wallets', 'Custom scenarios', 'Dedicated environment', 'SLA guarantee', 'White-label option', 'API access'],
    cta: 'Contact Sales',
    ctaStyle: 'bg-white/5 text-surface hover:bg-white/10',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-surface">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-bg/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">BlockCoin</span>
            <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full font-semibold hidden sm:inline">USDT Lab</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-surface/60">
            <a href="#features" className="hover:text-surface transition">Features</a>
            <a href="#how-it-works" className="hover:text-surface transition">How It Works</a>
            <a href="#pricing" className="hover:text-surface transition">Pricing</a>
            <a href="#testimonials" className="hover:text-surface transition">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-surface/70 hover:text-surface transition px-3 py-1.5">
              Sign In
            </Link>
            <Link href="/register" className="text-sm bg-primary text-bg font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Trusted by 500+ blockchain developers worldwide
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Simulate USDT Wallets
            <br />
            <span className="text-primary">Without Real Risk</span>
          </h1>

          <p className="text-lg sm:text-xl text-surface/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            The most powerful virtual USDT wallet platform for developers, QA engineers, and fintech teams.
            Test transactions, simulate attacks, and integrate testnets — all in a safe, isolated environment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register"
              className="w-full sm:w-auto bg-primary text-bg font-bold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition text-base">
              Start Free — No Card Required
            </Link>
            <a href="#how-it-works"
              className="w-full sm:w-auto bg-white/5 border border-white/10 text-surface font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition text-base">
              See How It Works →
            </a>
          </div>

          {/* Hero mockup */}
          <div className="bg-card border border-white/10 rounded-2xl p-1 shadow-2xl max-w-3xl mx-auto">
            <div className="bg-sidebar rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-surface/40">Total Virtual Balance</p>
                  <p className="text-3xl font-bold font-mono text-primary mt-1">125,000.000000</p>
                  <p className="text-xs text-surface/30 mt-0.5">USDT — BlockCoin Internal</p>
                </div>
                <span className="text-xs bg-warning/20 text-warning px-3 py-1 rounded-full font-semibold">INTERNAL</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Main Wallet', bal: '50,000.00', status: 'ACTIVE', color: 'border-primary/20' },
                  { label: 'Test Wallet', bal: '25,000.00', status: 'ACTIVE', color: 'border-secondary/20' },
                  { label: 'Security Lab', bal: '50,000.00', status: 'ACTIVE', color: 'border-warning/20' },
                ].map(w => (
                  <div key={w.label} className={`bg-bg rounded-xl border ${w.color} p-3`}>
                    <p className="text-xs text-surface/40">{w.label}</p>
                    <p className="font-mono text-sm font-bold text-primary mt-1">{w.bal}</p>
                    <span className="text-xs text-primary/60">{w.status}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { type: 'CREDIT', amount: '+10,000.000000', status: 'COMPLETED', color: 'text-primary', icon: '↓' },
                  { type: 'DEBIT', amount: '-5,000.000000', status: 'PROCESSING', color: 'text-warning', icon: '↑' },
                  { type: 'CREDIT', amount: '+25,000.000000', status: 'PENDING', color: 'text-secondary', icon: '↓' },
                ].map((tx, i) => (
                  <div key={i} className="flex items-center justify-between bg-bg/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${tx.type === 'CREDIT' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'}`}>{tx.icon}</span>
                      <span className="text-xs text-surface/60">{tx.type}</span>
                    </div>
                    <span className={`font-mono text-xs font-semibold ${tx.color}`}>{tx.amount} USDT</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === 'COMPLETED' ? 'bg-primary/20 text-primary' : tx.status === 'PROCESSING' ? 'bg-secondary/20 text-secondary' : 'bg-warning/20 text-warning'}`}>{tx.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5 bg-sidebar/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-3xl sm:text-4xl font-bold text-primary">{s.value}</p>
                <p className="text-sm text-surface/50 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Everything You Need</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for Serious Blockchain Testing</h2>
            <p className="text-surface/50 max-w-xl mx-auto">
              From simple wallet simulations to complex multi-scenario security testing — BlockCoin Lab has every tool your team needs.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-card border border-white/5 rounded-2xl p-6 hover:border-white/10 transition group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition">{f.title}</h3>
                <p className="text-sm text-surface/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-sidebar/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-secondary text-sm font-semibold uppercase tracking-widest mb-3">Simple Setup</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Up and Running in Minutes</h2>
            <p className="text-surface/50 max-w-xl mx-auto">No blockchain knowledge required. No testnet faucets. No waiting.</p>
          </div>
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">{s.step}</span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-base mb-1">{s.title}</h3>
                  <p className="text-surface/50 text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block shrink-0 w-px h-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-warning text-sm font-semibold uppercase tracking-widest mb-3">Trusted by Teams</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">What Developers Are Saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-card border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex text-warning text-sm">{'★★★★★'}</div>
                <p className="text-sm text-surface/70 leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${t.color}`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-surface/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 bg-sidebar/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Simple Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Start Free, Scale When Ready</h2>
            <p className="text-surface/50 max-w-xl mx-auto">No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.name} className={`bg-card border ${p.color} rounded-2xl p-6 flex flex-col relative`}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-bg text-xs font-bold px-4 py-1 rounded-full">
                    {p.badge}
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-sm text-surface/50 font-medium mb-1">{p.name}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">{p.price}</span>
                    <span className="text-surface/40 text-sm mb-1">{p.sub}</span>
                  </div>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-surface/70">
                      <span className="text-primary shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`text-center font-semibold py-2.5 rounded-xl transition text-sm ${p.ctaStyle}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Build Without Risk?
          </h2>
          <p className="text-surface/50 mb-10 text-lg">
            Join hundreds of developers who test smarter with BlockCoin Lab. Free forever on the Starter plan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register"
              className="w-full sm:w-auto bg-primary text-bg font-bold px-10 py-4 rounded-xl hover:bg-primary/90 transition text-base">
              Create Free Account
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto border border-white/10 text-surface font-semibold px-10 py-4 rounded-xl hover:bg-white/5 transition text-base">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">BlockCoin</span>
            <span className="text-xs text-surface/30">USDT Lab</span>
          </div>
          <p className="text-xs text-surface/30 text-center">
            All balances are virtual. No real assets. For simulation and testing purposes only.
          </p>
          <div className="flex items-center gap-6 text-xs text-surface/40">
            <Link href="/login" className="hover:text-surface transition">Sign In</Link>
            <Link href="/register" className="hover:text-surface transition">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
