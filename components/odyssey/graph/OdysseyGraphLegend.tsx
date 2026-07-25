const STATUS_LEGEND: { label: string; className: string }[] = [
  { label: 'Recommended / in progress', className: 'border-campus-blue-600 dark:border-campus-blue-dark' },
  { label: 'Awaiting Evidence / review', className: 'border-campus-amber-600 dark:border-campus-amber-dark border-dashed' },
  { label: 'Completed / verified', className: 'border-campus-green-600 dark:border-campus-green-dark' },
  { label: 'Blocked', className: 'border-campus-red-600 dark:border-campus-red-dark border-dashed' },
  { label: 'Superseded / not relevant', className: 'border-campus-border opacity-50' },
]

export function OdysseyGraphLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 font-campus-sans text-campus-xs text-campus-muted">
      {STATUS_LEGEND.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full border-2 bg-campus-surface ${item.className}`} aria-hidden="true" />
          {item.label}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="h-px w-4 border-t border-dashed border-campus-muted" aria-hidden="true" /> alternative route
      </span>
    </div>
  )
}
