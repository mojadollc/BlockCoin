interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
}

export function Table<T extends Record<string, unknown>>({ columns, data, emptyMessage = 'No data' }: Props<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            {columns.map(col => (
              <th key={col.key} className="text-left py-3 px-4 text-surface/50 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-surface/40">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/2 transition">
                {columns.map(col => (
                  <td key={col.key} className="py-3 px-4 text-surface/80">
                    {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
