'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/services/api'
import { PasswordInput } from '@/components/ui/PasswordInput'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/v1/auth/login', form)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-auth-in">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-black tracking-tight mb-1.5">Welcome back</h2>
        <p className="text-surface/40 text-sm">Sign in to your BlockCoin account</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 text-danger text-sm mb-6 bg-danger/8 border border-danger/20 px-4 py-3 rounded-xl animate-shake">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="group">
          <label className="block text-xs font-bold text-surface/40 uppercase tracking-widest mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface/25 group-focus-within:text-primary transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full bg-sidebar border border-white/8 rounded-xl pl-11 pr-4 py-3.5 text-surface placeholder:text-surface/20 focus:outline-none focus:border-primary focus:bg-sidebar/80 transition-all text-sm"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="group">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-surface/40 uppercase tracking-widest">Password</label>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface/25 group-focus-within:text-primary transition-colors z-10 pointer-events-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <PasswordInput
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-sidebar border border-white/8 rounded-xl pl-11 py-3.5 text-surface placeholder:text-surface/20 focus:outline-none focus:border-primary focus:bg-sidebar/80 transition-all text-sm"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="relative w-full bg-primary text-bg font-black py-3.5 rounded-xl disabled:opacity-60 transition-all text-sm mt-2 overflow-hidden group hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
        >
          <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-xl" />
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin" width="15" height="15" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </span>
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-xs text-surface/20 font-semibold">OR</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Register link */}
      <div className="bg-sidebar/50 border border-white/5 rounded-xl px-5 py-4 text-center">
        <p className="text-sm text-surface/40">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary font-bold hover:text-primary/80 transition-colors">
            Create one free →
          </Link>
        </p>
      </div>

      <style jsx global>{`
        @keyframes auth-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-auth-in { animation: auth-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-shake { animation: shake 0.4s ease-out; }
      `}</style>
    </div>
  )
}
