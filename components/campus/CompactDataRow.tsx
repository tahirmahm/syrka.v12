import type { HTMLAttributes } from 'react'

export interface CompactDataRowProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

/** Full-width row for list-mode pages — hairline divider, no card chrome. Pairs with CompactDataRow.List for the divided-list wrapper. */
export function CompactDataRow({ interactive = false, className = '', children, ...props }: CompactDataRowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-1 py-3 ${interactive ? 'cursor-pointer transition-colors duration-campus-fast hover:bg-campus-surface-raised' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CompactDataRowList({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`divide-y divide-campus-border ${className}`} {...props}>
      {children}
    </div>
  )
}
