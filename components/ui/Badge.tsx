import type { HTMLAttributes } from 'react'

export type BadgeTone = 'neutral' | 'gold' | 'blue' | 'green' | 'amber' | 'red' | 'purple'

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-campus-stone-100 text-campus-ink-700 dark:bg-campus-surface-raised dark:text-campus-muted',
  gold: 'bg-campus-gold-500/15 text-campus-gold-500 dark:text-campus-gold-dark',
  blue: 'bg-campus-blue-600/10 text-campus-blue-600 dark:text-campus-blue-dark',
  green: 'bg-campus-green-600/10 text-campus-green-600 dark:text-campus-green-dark',
  amber: 'bg-campus-amber-600/10 text-campus-amber-600 dark:text-campus-amber-dark',
  red: 'bg-campus-red-600/10 text-campus-red-600 dark:text-campus-red-dark',
  purple: 'bg-campus-purple-600/10 text-campus-purple-600 dark:text-campus-purple-dark',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

/** Semantic label — always paired with text, never color alone (DESIGN-001 §13). */
export function Badge({ tone = 'neutral', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-campus-sm px-2 py-0.5 font-mono text-xs font-medium tracking-wide ${toneClasses[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
