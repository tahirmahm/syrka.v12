import type { HTMLAttributes } from 'react'

/** Larger structural surface for major dashboard/page regions (DESIGN-001 §7). */
export function Panel({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-campus-lg border border-campus-border bg-campus-surface p-6 shadow-campus-panel ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
