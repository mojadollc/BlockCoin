interface Props {
  page: number
  limit: number
  total: number
  onPage: (p: number) => void
}

export function Pagination({ page, limit, total, onPage }: Props) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-sm">
      <span className="text-surface/40">
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-white/5 disabled:opacity-30 hover:bg-white/10 transition"
        >
          ←
        </button>
        <span className="px-3 py-1 text-surface/60">{page} / {totalPages}</span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 rounded bg-white/5 disabled:opacity-30 hover:bg-white/10 transition"
        >
          →
        </button>
      </div>
    </div>
  )
}
