export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />
  )
}

export function ShimmerRows({ rows = 5, cols = 1 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Shimmer className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-3.5 w-32" />
              <Shimmer className="h-3 w-48" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Shimmer className="h-3.5 w-24" />
            <Shimmer className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ShimmerCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-white/5 rounded-xl p-6 space-y-4">
          <div className="flex justify-between">
            <Shimmer className="h-3.5 w-24" />
            <Shimmer className="h-5 w-12 rounded-full" />
          </div>
          <Shimmer className="h-8 w-36" />
          <Shimmer className="h-3 w-20" />
          <div className="flex gap-2 pt-2">
            <Shimmer className="h-8 flex-1 rounded-lg" />
            <Shimmer className="h-8 flex-1 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ShimmerStats({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-3 md:gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-white/5 rounded-xl p-6 space-y-3">
          <Shimmer className="h-3 w-20" />
          <Shimmer className="h-8 w-16" />
          <Shimmer className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

export function ShimmerTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y divide-white/5">
      <div className="px-4 py-3 flex gap-4 border-b border-white/5">
        {[40, 28, 20, 16, 16].map((w, i) => (
          <Shimmer key={i} className={`h-3 w-${w}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3.5 flex items-center gap-4">
          <Shimmer className="h-3 w-40 flex-1" />
          <Shimmer className="h-3 w-28" />
          <Shimmer className="h-3 w-20" />
          <Shimmer className="h-5 w-16 rounded-full" />
          <Shimmer className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}
