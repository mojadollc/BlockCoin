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
    <div className="bg-card rounded-2xl border border-white/8 p-6 shadow-2xl shadow-black/40">
      <h2 className="text-lg font-bold text-surface mb-1">Welcome back</h2>
      <p className="text-sm text-surface/40 mb-6">Sign in to your account</p>

      {error && (
        <div className="flex items-center gap-2 text-danger text-sm mb-4 bg-danger/10 border border-danger/20 p-3 rounded-xl">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-surface/50 uppercase tracking-wide mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
            className="w-full bg-sidebar border border-white/10 rounded-xl px-4 py-3 text-surface placeholder:text-surface/20 focus:outline-none focus:border-primary transition text-sm"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-surface/50 uppercase tracking-wide">Password</label>
          </div>
          <PasswordInput
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full bg-sidebar border border-white/10 rounded-xl px-4 py-3 text-surface placeholder:text-surface/20 focus:outline-none focus:border-primary transition text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-bg font-bold py-3.5 rounded-xl disabled:opacity-50 active:scale-95 transition-all text-sm mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Signing in…
            </span>
          ) : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-surface/40 mt-5">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary font-semibold">Create one</Link>
      </p>
    </div>
  )
}
