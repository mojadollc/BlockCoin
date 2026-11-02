'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/services/api'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <div>
      <label className="block text-sm text-surface/70 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface focus:outline-none focus:border-primary"
        required
      />
    </div>
  )

  return (
    <div className="bg-card rounded-xl p-8 shadow-xl">
      <h2 className="text-xl font-semibold mb-6">Create Account</h2>
      {error && <p className="text-danger text-sm mb-4 bg-danger/10 p-3 rounded-lg">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {field('firstName', 'First Name')}
          {field('lastName', 'Last Name')}
        </div>
        {field('email', 'Email', 'email')}
        {field('password', 'Password', 'password')}
        <p className="text-xs text-surface/50">Min 8 chars, one uppercase, one number</p>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-bg font-semibold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
        >
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </form>
      <p className="text-center text-sm text-surface/60 mt-4">
        Have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
