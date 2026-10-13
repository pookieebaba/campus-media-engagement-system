import React from 'react';
import EmptyState from './EmptyState.jsx';

/**
 * columns: Array<{ key: string, label: string, render?: (value, row) => ReactNode }>
 * data: Array<object>
 */
export function DataTable({
  columns = [],
  data = [],
  emptyTitle = 'No data',
  emptyDescription,
  loading = false,
  className = '',
}) {
  if (!loading && data.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className={['w-full overflow-x-auto rounded-2xl border border-border', className].join(' ')}>
      <table className="w-full text-sm font-body border-collapse">
        <thead>
          <tr className="bg-stone border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-sand rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((row, rowIdx) => (
                <tr
                  key={row._id ?? row.id ?? rowIdx}
                  className="border-b border-border last:border-0 hover:bg-stone/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-foreground">
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
