import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-campus-md border border-dashed border-campus-border px-6 py-12 text-center">
      <p className="font-campus-sans text-campus-base font-medium text-campus-text">{title}</p>
      {description && <p className="max-w-sm font-campus-sans text-campus-sm text-campus-muted">{description}</p>}
      {action}
    </div>
  )
}
