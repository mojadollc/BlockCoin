interface Props {
  label: string
  value: string | number
  sub?: string
  color?: string
}

export function StatCard({ label, value, sub, color = 'text-primary' }: Props) {
  return (
    <div className="bg-card rounded-xl p-6 border border-white/5">
      <p className="text-sm text-surface/50">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-surface/40 mt-1">{sub}</p>}
    </div>
  )
}
