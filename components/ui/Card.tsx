import type { HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

/** Evidence-first content container (DESIGN-001 §8 "Cards are evidence containers"). */
export function Card({ interactive = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-campus-md border border-campus-border bg-campus-surface shadow-campus-subtle ${
        interactive ? 'transition-colors duration-campus-fast hover:bg-campus-surface-raised cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
