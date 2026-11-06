'use client'
import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { api } from '@/services/api'

type Level = 'NONE' | 'READ' | 'WRITE'

// Module-level cache so all components share one fetch per session
let cache: Record<string, Level> | null = null
let fetchPromise: Promise<void> | null = null

function loadPermissions(userId: string): Promise<void> {
  if (fetchPromise) return fetchPromise
  fetchPromise = api
    .get<Array<{ feature: string; level: string }>>(`/api/v1/admin/users/${userId}/permissions`)
    .then(perms => {
      cache = {}
      for (const p of perms) cache[p.feature] = p.level as Level
    })
    .catch(() => { cache = {} })
  return fetchPromise
}

export function usePermission(feature: string): { level: Level; canRead: boolean; canWrite: boolean; loading: boolean } {
  const { user } = useAuth()
  const [level, setLevel] = useState<Level>('NONE')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    // ADMIN has full access to everything — no fetch needed
    if (user.role === 'ADMIN') {
      setLevel('WRITE')
      setLoading(false)
      return
    }
    if (user.role !== 'SUB_ADMIN') {
      setLevel('NONE')
      setLoading(false)
      return
    }
    if (cache) {
      setLevel(cache[feature] ?? 'NONE')
      setLoading(false)
      return
    }
    loadPermissions(user.id).then(() => {
      setLevel(cache?.[feature] ?? 'NONE')
      setLoading(false)
    })
  }, [user, feature])

  return { level, canRead: level !== 'NONE', canWrite: level === 'WRITE', loading }
}
