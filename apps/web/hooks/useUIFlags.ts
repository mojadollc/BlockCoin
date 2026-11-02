'use client'
import { useEffect, useState } from 'react'
import { api } from '@/services/api'

export interface UIFlags {
  show_wallet_notice: boolean
  show_simulation_notice: boolean
  show_env_badge: boolean
}

const DEFAULT: UIFlags = {
  show_wallet_notice: true,
  show_simulation_notice: true,
  show_env_badge: true,
}

export function useUIFlags(): UIFlags {
  const [flags, setFlags] = useState<UIFlags>(DEFAULT)

  useEffect(() => {
    api.get<UIFlags>('/api/v1/admin/ui-flags').then(setFlags).catch(() => {})
  }, [])

  return flags
}
