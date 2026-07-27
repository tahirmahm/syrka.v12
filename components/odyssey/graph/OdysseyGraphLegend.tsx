const STATUS_LEGEND: { label: string; className: string }[] = [
  { label: 'Recommended / in progress', className: 'border-campus-blue-600 dark:border-campus-blue-dark' },
  { label: 'Awaiting Evidence / review', className: 'border-campus-amber-600 dark:border-campus-amber-dark border-dashed' },
  { label: 'Completed / verified', className: 'border-campus-green-600 dark:border-campus-green-dark' },
  { label: 'Blocked', className: 'border-campus-red-600 dark:border-campus-red-dark border-dashed' },
  { label: 'Superseded / not relevant', className: 'border-campus-border opacity-50' },
]

const EDGE_LEGEND: { label: string; lineClassName: string }[] = [
  { label: 'Required prerequisite', lineClassName: 'border-t border-campus-muted' },
  { label: 'Alternative / optional route', lineClassName: 'border-t border-dashed border-campus-muted' },
  { label: 'Blocked route', lineClassName: 'border-t border-dashed border-campus-red-600 dark:border-campus-red-dark' },
  { label: 'Superseded / inactive route', lineClassName: 'border-t border-campus-muted opacity-40' },
]

/** Every node and edge treatment here is described in text — status and edge meaning are never colour-only. */
export function OdysseyGraphLegend() {
  return (
    <div className="flex flex-col gap-2 font-campus-sans text-campus-xs text-campus-muted">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {STATUS_LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full border-2 bg-campus-surface ${item.className}`} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-campus-border pt-1.5">
        {EDGE_LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`h-0 w-4 ${item.lineClassName}`} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
