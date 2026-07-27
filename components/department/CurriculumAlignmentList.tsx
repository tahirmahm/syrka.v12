import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { CurriculumAlignmentIssue } from '@/lib/campus-types'

const BREAK_LABEL: Record<CurriculumAlignmentIssue['breakType'], string> = {
  no_course_addresses_outcome: 'No course addresses this outcome',
  course_without_evidence_producing_assessment: 'Course has no Evidence-producing assessment',
  assessment_without_sufficient_evidence: 'Assessment designed, but no Evidence produced yet',
  evidence_awaiting_review: 'Evidence produced, but still awaiting review',
  reviewed_but_insufficient_confidence: 'Reviewed, but Capability confidence remains insufficient',
  capability_stale: 'Capability developed, but now stale',
  capability_not_in_passport: 'Capability developed, but not represented in the Passport',
}

/**
 * The intent -> proof chain (declared outcome -> course -> assessment ->
 * Evidence -> review -> Capability -> Passport) and exactly where it
 * breaks, per issue — never collapsed into one alignment score.
 */
export function CurriculumAlignmentList({ issues }: { issues: CurriculumAlignmentIssue[] }) {
  if (issues.length === 0) {
    return <EmptyState title="No alignment breaks identified" description="Every declared outcome currently has a clear path from course intent to reviewed Evidence." />
  }

  return (
    <ol className="flex flex-col gap-3">
      {issues.map((issue) => (
        <li key={issue.id} className="rounded-campus-md border border-campus-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="amber">{BREAK_LABEL[issue.breakType]}</Badge>
            <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{issue.capabilityName}</p>
          </div>
          <p className="mt-2 font-campus-sans text-campus-sm text-campus-muted">{issue.description}</p>
        </li>
      ))}
    </ol>
  )
}
