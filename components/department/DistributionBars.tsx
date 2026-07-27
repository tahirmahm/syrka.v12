/**
 * A labelled, accessible distribution — every bar is paired with its exact
 * count in text, never colour/width alone, and always shown as a table-like
 * list so it survives being read by assistive tech.
 */
export function DistributionBars({ data, total }: { data: Record<string, number>; total?: number }) {
  const entries = Object.entries(data).filter(([, count]) => count > 0)
  const max = Math.max(1, ...entries.map(([, count]) => count))
  const denominator = total ?? entries.reduce((sum, [, count]) => sum + count, 0)

  if (entries.length === 0) {
    return <p className="font-campus-sans text-campus-sm text-campus-muted">No data for this distribution yet.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map(([label, count]) => (
        <li key={label} className="flex items-center gap-3">
          <span className="w-40 shrink-0 font-campus-sans text-campus-sm text-campus-text">{label.replace(/_/g, ' ')}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-campus-surface-raised" aria-hidden="true">
            <span className="block h-full rounded-full bg-campus-blue-600 dark:bg-campus-blue-dark" style={{ width: `${(count / max) * 100}%` }} />
          </span>
          <span className="w-20 shrink-0 text-right font-campus-mono text-campus-xs text-campus-muted">
            {count} {denominator > 0 ? `(${Math.round((count / denominator) * 100)}%)` : ''}
          </span>
        </li>
      ))}
    </ul>
  )
}
