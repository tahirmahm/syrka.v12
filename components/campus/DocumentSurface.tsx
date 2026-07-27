import type { HTMLAttributes } from 'react'

/** Full-width, flat document-reading surface — the Career Passport record, printable policy pages. Depth stays with what floats above content, not the content itself. */
export function DocumentSurface({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col divide-y divide-campus-border border border-campus-border rounded-campus-md bg-campus-surface ${className}`} {...props}>
      {children}
    </div>
  )
}

/** One full-width section within a DocumentSurface. */
export function DocumentSection({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}
