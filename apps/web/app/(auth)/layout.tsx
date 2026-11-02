export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">BlockCoin</h1>
          <p className="text-sm text-surface/60 mt-1">USDT Wallet Platform</p>
        </div>
        {children}
      </div>
    </div>
  )
}
