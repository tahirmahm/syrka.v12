import Link from 'next/link'
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr'
import { Card } from '@/components/ui/Card'
import { Status } from '@/components/ui/Status'
import { Badge } from '@/components/ui/Badge'
import type { EvidenceWithReview } from '@/lib/repositories'
import type { CapabilityDefinition, Course } from '@/lib/campus-types'
import { SOURCE_TYPE_LABELS } from '@/lib/constants/evidence'
import { formatDate, formatRelativeTime } from '@/lib/utilities/format-relative-time'

export interface EvidenceRowProps {
  item: EvidenceWithReview
  course?: Course
  capabilities: CapabilityDefinition[]
}

export function EvidenceRow({ item, course, capabilities }: EvidenceRowProps) {
  const { record, review } = item
  return (
    <Link href={`/student/evidence/${record.id}`}>
      <Card interactive className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{record.title}</p>
            <p className="mt-0.5 font-campus-mono text-campus-xs text-campus-muted">
              {SOURCE_TYPE_LABELS[record.sourceType]}
              {course && ` · ${course.code}`}
              {' · '}
              <time dateTime={record.submittedAt}>{formatDate(record.submittedAt)}</time>
              {' · '}
              {formatRelativeTime(record.submittedAt)}
            </p>
          </div>
          <Status tone={review.status} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {capabilities.map((cap) => (
            <Badge key={cap.id} tone="neutral">
              {cap.name}
            </Badge>
          ))}
          {record.supersedesEvidenceId && (
            <span className="flex items-center gap-1 font-campus-mono text-campus-xs text-campus-muted">
              <ArrowsClockwise size={12} aria-hidden="true" /> Revision
            </span>
          )}
        </div>
      </Card>
    </Link>
  )
}
