export type Role = 'ADMIN' | 'USER'
export type WalletStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED'
export type TransactionType = 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'ADJUSTMENT'
export type SimulationStatus = 'CREATED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED'
export type Environment = 'INTERNAL' | 'TESTNET'
export type TestnetNetwork = 'SEPOLIA' | 'TRON_NILE'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  isActive: boolean
}

export interface TokenPayload {
  sub: string
  email: string
  role: Role
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

/** Convert BigInt base units (6 decimals) to display string */
export function unitsToDisplay(units: bigint): string {
  const str = units.toString().padStart(7, '0')
  return `${str.slice(0, -6)}.${str.slice(-6)}`
}

/** Convert display string to BigInt base units */
export function displayToUnits(display: string): bigint {
  const [whole, frac = ''] = display.split('.')
  const fracPadded = frac.padEnd(6, '0').slice(0, 6)
  return BigInt(whole + fracPadded)
}
