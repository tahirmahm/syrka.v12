import { Badge } from '@/components/ui/Badge'
import type { BadgeTone } from '@/components/ui/Badge'
import type { ObservedProgrammeCoverage } from '@/lib/campus-types'

const COVERAGE_LABEL: Record<ObservedProgrammeCoverage['coverageState'], string> = {
  covered: 'Covered',
  under_covered: 'Under-covered',
  over_concentrated: 'Over-concentrated',
  missing_evidence: 'Missing Evidence',
  stale_evidence: 'Stale Evidence',
  review_bottleneck: 'Review bottleneck',
}

const COVERAGE_TONE: Record<ObservedProgrammeCoverage['coverageState'], BadgeTone> = {
  covered: 'green',
  under_covered: 'amber',
  over_concentrated: 'purple',
  missing_evidence: 'red',
  stale_evidence: 'amber',
  review_bottleneck: 'red',
}

/**
 * Accessible programme Capability map — a structured table rather than a
 * graph, since the intent-vs-observed relationship here is naturally
 * tabular. Shows intended coverage, observed coverage, and exactly where it
 * breaks down (gaps, staleness, review bottlenecks), never a single score.
 */
export function CoverageTable({ rows }: { rows: ObservedProgrammeCoverage[] }) {
  if (rows.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-campus-md border border-campus-border">
      <table className="w-full min-w-[720px] border-collapse font-campus-sans text-campus-sm">
        <thead>
          <tr className="border-b border-campus-border bg-campus-surface-raised text-left">
            <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
              Outcome
            </th>
            <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
              Capability
            </th>
            <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
              Course(s)
            </th>
            <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
              Intended
            </th>
            <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
              Assessments
            </th>
            <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
              Evidence produced
            </th>
            <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
              Reviews pending
            </th>
            <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
              Coverage
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.outcomeId}-${row.capabilityId}-${i}`} className="border-b border-campus-border last:border-b-0">
              <td className="px-3 py-2 text-campus-muted">{row.outcomeTitle}</td>
              <td className="px-3 py-2 font-medium text-campus-text">{row.capabilityName}</td>
              <td className="px-3 py-2 text-campus-muted">{row.courseLabels.join(', ')}</td>
              <td className="px-3 py-2 text-campus-muted">{row.intendedMaturity ?? '—'}</td>
              <td className="px-3 py-2 text-campus-muted">{row.assessmentsDesigned}</td>
              <td className="px-3 py-2 text-campus-muted">{row.evidenceProduced}</td>
              <td className="px-3 py-2 text-campus-muted">{row.reviewsPending}</td>
              <td className="px-3 py-2">
                <Badge tone={COVERAGE_TONE[row.coverageState]}>{COVERAGE_LABEL[row.coverageState]}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
