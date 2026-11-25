'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/services/api'
import { PasswordInput } from '@/components/ui/PasswordInput'

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: 'Weak', color: '#EF5350' }
  if (score <= 2) return { score, label: 'Fair', color: '#F5B942' }
  if (score <= 3) return { score, label: 'Good', color: '#2684FF' }
  return { score, label: 'Strong', color: '#00C89B' }
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const strength = useMemo(() => passwordStrength(form.password), [form.password])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/v1/auth/register', form)
      router.push('/login')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-auth-in">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-black tracking-tight mb-1.5">Create your account</h2>
        <p className="text-surface/40 text-sm">Join 500+ users on BlockCoin — free forever</p>
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
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          {(['firstName', 'lastName'] as const).map((key, i) => (
            <div key={key} className="group">
              <label className="block text-xs font-bold text-surface/40 uppercase tracking-widest mb-2">
                {i === 0 ? 'First Name' : 'Last Name'}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface/25 group-focus-within:text-primary transition-colors pointer-events-none">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={i === 0 ? 'John' : 'Doe'}
                  className="w-full bg-sidebar border border-white/8 rounded-xl pl-9 pr-3 py-3.5 text-surface placeholder:text-surface/20 focus:outline-none focus:border-primary focus:bg-sidebar/80 transition-all text-sm"
                  required
                />
              </div>
            </div>
          ))}
        </div>

        {/* Email */}
        <div className="group">
          <label className="block text-xs font-bold text-surface/40 uppercase tracking-widest mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface/25 group-focus-within:text-primary transition-colors pointer-events-none">
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
          <label className="block text-xs font-bold text-surface/40 uppercase tracking-widest mb-2">
            Password
          </label>
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

          {/* Password strength meter */}
          {form.password && (
            <div className="mt-2.5 animate-auth-in">
              <div className="flex gap-1 mb-1.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.06)',
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-surface/30">Min 8 chars, uppercase, number</p>
                <p className="text-xs font-bold transition-colors" style={{ color: strength.color }}>
                  {strength.label}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Terms note */}
        <p className="text-xs text-surface/25 leading-relaxed">
          By creating an account you agree to our{' '}
          <span className="text-surface/40 font-semibold">Terms of Service</span> and{' '}
          <span className="text-surface/40 font-semibold">Privacy Policy</span>.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="relative w-full bg-primary text-bg font-black py-3.5 rounded-xl disabled:opacity-60 transition-all text-sm overflow-hidden group hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
        >
          <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-xl" />
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin" width="15" height="15" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Creating account…
              </>
            ) : (
              <>
                Create Account
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

      {/* Login link */}
      <div className="bg-sidebar/50 border border-white/5 rounded-xl px-5 py-4 text-center">
        <p className="text-sm text-surface/40">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-bold hover:text-primary/80 transition-colors">
            Sign in →
          </Link>
        </p>
      </div>

    </div>
  )
}
