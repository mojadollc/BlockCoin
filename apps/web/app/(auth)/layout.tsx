export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">BlockCoin USDT Lab</h1>
          <p className="text-sm text-surface/60 mt-1">Wallet Simulation & Security Testing</p>
          <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold bg-warning/20 text-warning rounded-full">
            INTERNAL ENVIRONMENT
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}
