import { SimulationStatus, Environment } from '@blockcoin/shared'

const STATUS_STYLES: Record<SimulationStatus, string> = {
  CREATED: 'bg-surface/10 text-surface/70',
  PENDING: 'bg-warning/20 text-warning',
  PROCESSING: 'bg-secondary/20 text-secondary',
  COMPLETED: 'bg-primary/20 text-primary',
  FAILED: 'bg-danger/20 text-danger',
  EXPIRED: 'bg-surface/10 text-surface/40',
  CANCELLED: 'bg-surface/10 text-surface/40',
}

export function StatusBadge({ status }: { status: SimulationStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

export function EnvBadge({ env }: { env: Environment }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      env === 'INTERNAL' ? 'bg-warning/20 text-warning' : 'bg-secondary/20 text-secondary'
    }`}>
      {env === 'INTERNAL' ? 'INTERNAL ENVIRONMENT' : 'TESTNET ENVIRONMENT'}
    </span>
  )
}
