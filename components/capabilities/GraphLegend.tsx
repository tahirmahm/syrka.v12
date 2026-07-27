const MATURITY_LEGEND: { label: string; className: string }[] = [
  { label: 'Emerging / Developing / Proficient', className: 'border-campus-blue-600 dark:border-campus-blue-dark' },
  { label: 'Advanced / Expert', className: 'border-campus-green-600 dark:border-campus-green-dark' },
  { label: 'Exposed', className: 'border-campus-stone-300 dark:border-campus-border' },
  { label: 'Stale', className: 'border-campus-stone-500' },
  { label: 'Revoked', className: 'border-campus-red-600 dark:border-campus-red-dark' },
]

export function GraphLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 font-campus-sans text-campus-xs text-campus-muted">
      {MATURITY_LEGEND.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full border-2 bg-campus-surface ${item.className}`} aria-hidden="true" />
          {item.label}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="h-px w-4 bg-campus-muted" aria-hidden="true" /> requires (prerequisite)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-px w-4 border-t border-dashed border-campus-muted" aria-hidden="true" /> related
      </span>
    </div>
  )
}
