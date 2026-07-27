import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import type { DepartmentPriority } from '@/lib/campus-types'

const URGENCY_TONE = { high: 'red', medium: 'amber', low: 'neutral' } as const

export function PriorityRow({ priority }: { priority: DepartmentPriority }) {
  return (
    <li className="flex flex-col gap-1.5 border-b border-campus-border py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={URGENCY_TONE[priority.urgency]}>{priority.urgency}</Badge>
        <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{priority.summary}</p>
      </div>
      <p className="font-campus-sans text-campus-sm text-campus-muted">{priority.detail}</p>
      <Link href={priority.actionHref} className="font-campus-sans text-campus-sm font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
        {priority.actionLabel} →
      </Link>
    </li>
  )
}
