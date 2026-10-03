import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Status } from '@/components/ui/Status'
import type { ReviewQueueEntry } from '@/lib/campus-types'
import { SOURCE_TYPE_LABELS } from '@/lib/constants/evidence'

export function FacultyReviewQueueRow({ entry }: { entry: ReviewQueueEntry }) {
  return (
    <Link href={`/faculty/evidence/${entry.evidenceId}`}>
      <Card interactive className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{entry.title}</p>
            <p className="font-campus-mono text-campus-xs text-campus-muted">
              {entry.studentName} · {entry.courseLabel ?? SOURCE_TYPE_LABELS[entry.sourceType]}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {entry.ageDays > 7 && entry.status === 'pending' && <Badge tone="red">{entry.ageDays}d</Badge>}
            {entry.hasRevisionHistory && <Badge tone="neutral">Revised</Badge>}
            <Status tone={entry.status} />
          </div>
        </div>
        {entry.linkedCapabilityNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.linkedCapabilityNames.map((name) => (
              <Badge key={name} tone="neutral">
                {name}
              </Badge>
            ))}
          </div>
        )}
        <p className="font-campus-sans text-campus-xs text-campus-muted">{entry.likelyImpactSummary}</p>
      </Card>
    </Link>
  )
}
