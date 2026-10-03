import type { ComponentType } from 'react'
import type { IconProps } from '@phosphor-icons/react'

export type StatusRailTone = 'neutral' | 'blue' | 'green' | 'amber' | 'red'

const TONE_CLASS: Record<StatusRailTone, string> = {
  neutral: 'text-campus-muted',
  blue: 'text-campus-blue-600 dark:text-campus-blue-dark',
  green: 'text-campus-green-600 dark:text-campus-green-dark',
  amber: 'text-campus-amber-600 dark:text-campus-amber-dark',
  red: 'text-campus-red-600 dark:text-campus-red-dark',
}

export interface StatusRailItem {
  icon: ComponentType<IconProps>
  label: string
  tone?: StatusRailTone
}

/**
 * Inline, always-visible status communication — icon + short label, never
 * colour alone. Generalises the marker pattern proven on Odyssey's roadmap
 * nodes for use anywhere a compact status needs to appear inline (list
 * rows, document sections, review workspaces).
 */
export function StatusRail({ items }: { items: StatusRailItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item, i) => {
        const Icon = item.icon
        const tone = item.tone ?? 'neutral'
        return (
          <span key={i} className={`flex items-center gap-1 font-campus-mono text-[10px] uppercase tracking-wide ${TONE_CLASS[tone]}`}>
            <Icon size={11} weight="fill" aria-hidden="true" />
            {item.label}
          </span>
        )
      })}
    </div>
  )
}
