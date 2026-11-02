'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/services/api'
import { AuthUser } from '@blockcoin/shared'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<AuthUser>('/api/v1/auth/me')
      .then(setUser)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  async function logout() {
    await api.post('/api/v1/auth/logout')
    router.push('/login')
  }

  return { user, loading, logout }
}
