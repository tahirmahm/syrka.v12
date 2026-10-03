import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { mockFacultyRepository } from '@/lib/repositories'
import { facultyUser } from '@/lib/mock-data/seed'
import { SOURCE_TYPE_LABELS } from '@/lib/constants/evidence'
import type { EvidenceSourceType } from '@/lib/campus-types'

export const metadata = { title: 'Analytics — Syrka Campus' }
export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = { pending: 'Awaiting review', verified: 'Verified', disputed: 'Revision requested', revoked: 'Revoked' }

export default async function FacultyAnalyticsPage() {
  const summary = await mockFacultyRepository.getAnalyticsSummary(facultyUser.id)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Analytics"
        subtitle="Evidence and review activity across your courses — computed from your own review record, not a performance score."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Analytics' }]} />}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Reviews (30d)</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{summary.reviewsCompletedLast30Days}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Avg. turnaround</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{summary.averageTurnaroundDays}d</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Ageing (7+ days)</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{summary.agingSubmissionsOver7Days}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Revision rate</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{Math.round(summary.revisionRate * 100)}%</p>
        </div>
      </div>

      <section aria-labelledby="status-heading">
        <h2 id="status-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Evidence status distribution
        </h2>
        <div className="overflow-x-auto rounded-campus-md border border-campus-border">
          <table className="w-full text-left font-campus-sans text-campus-sm">
            <thead className="border-b border-campus-border bg-campus-surface-raised">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium text-campus-text">
                  Status
                </th>
                <th scope="col" className="px-4 py-2 font-medium text-campus-text">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary.statusDistribution).map(([status, count]) => (
                <tr key={status} className="border-b border-campus-border last:border-0">
                  <td className="px-4 py-3 text-campus-text">{STATUS_LABELS[status] ?? status}</td>
                  <td className="px-4 py-3 text-campus-muted">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="type-heading">
        <h2 id="type-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Evidence types used
        </h2>
        <div className="overflow-x-auto rounded-campus-md border border-campus-border">
          <table className="w-full text-left font-campus-sans text-campus-sm">
            <thead className="border-b border-campus-border bg-campus-surface-raised">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium text-campus-text">
                  Evidence type
                </th>
                <th scope="col" className="px-4 py-2 font-medium text-campus-text">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary.evidenceTypeDistribution).map(([type, count]) => (
                <tr key={type} className="border-b border-campus-border last:border-0">
                  <td className="px-4 py-3 text-campus-text">{SOURCE_TYPE_LABELS[type as EvidenceSourceType] ?? type}</td>
                  <td className="px-4 py-3 text-campus-muted">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="coverage-heading">
        <h2 id="coverage-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Course Evidence coverage
        </h2>
        <div className="overflow-x-auto rounded-campus-md border border-campus-border">
          <table className="w-full text-left font-campus-sans text-campus-sm">
            <thead className="border-b border-campus-border bg-campus-surface-raised">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium text-campus-text">
                  Course
                </th>
                <th scope="col" className="px-4 py-2 font-medium text-campus-text">
                  Capabilities with Evidence
                </th>
                <th scope="col" className="px-4 py-2 font-medium text-campus-text">
                  Evidence gaps
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.courseCoverage.map((c) => (
                <tr key={c.courseId} className="border-b border-campus-border last:border-0">
                  <td className="px-4 py-3 text-campus-text">{c.courseLabel}</td>
                  <td className="px-4 py-3 text-campus-muted">{c.capabilitiesCovered}</td>
                  <td className="px-4 py-3 text-campus-muted">{c.evidenceGaps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="font-campus-sans text-campus-xs text-campus-muted">
        {summary.studentsAwaitingReviewCount} {summary.studentsAwaitingReviewCount === 1 ? 'student has' : 'students have'} Evidence awaiting your review.
      </p>
    </div>
  )
}
