import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockFacultyRepository } from '@/lib/repositories'
import { facultyUser, courses } from '@/lib/mock-data/seed'
import { formatRelativeTime } from '@/lib/utilities/format-relative-time'

export const metadata = { title: 'Faculty Overview — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function FacultyOverviewPage() {
  const [profile, workload, queue, assignments] = await Promise.all([
    mockFacultyRepository.getProfile(facultyUser.id),
    mockFacultyRepository.getWorkloadSummary(facultyUser.id),
    mockFacultyRepository.listReviewQueue(facultyUser.id),
    mockFacultyRepository.listCourseAssignments(facultyUser.id),
  ])

  const pending = queue.filter((e) => e.status === 'pending')
  const aging = pending.filter((e) => e.ageDays > 7)
  const needsRevision = queue.filter((e) => e.status === 'disputed')
  const recentDecisions = (
    await Promise.all(queue.filter((e) => e.status !== 'pending').map((e) => mockFacultyRepository.listReviewHistory(e.evidenceId)))
  )
    .flat()
    .sort((a, b) => new Date(b.decision.decidedAt).getTime() - new Date(a.decision.decidedAt).getTime())
    .slice(0, 5)

  const courseGaps = await Promise.all(
    assignments.map(async (a) => {
      const coverage = await mockFacultyRepository.getCourseCapabilityCoverage(a.courseId)
      const course = courses.find((c) => c.id === a.courseId)
      return { courseId: a.courseId, courseLabel: course ? `${course.code} ${course.title}` : a.courseId, gaps: coverage.filter((c) => c.evidenceProducedCount === 0 || c.claimsAwaitingReview > 0) }
    })
  )

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <PageHeader
        title={`Welcome back, ${profile?.name.split(' ').slice(-1)[0] ?? facultyUser.name.split(' ').slice(-1)[0]}`}
        subtitle={`${workload.coursesTaught} ${workload.coursesTaught === 1 ? 'course' : 'courses'} · ${workload.pendingReviewCount} pending ${workload.pendingReviewCount === 1 ? 'review' : 'reviews'}`}
      />

      {/* Workload summary */}
      <section aria-labelledby="workload-heading">
        <h2 id="workload-heading" className="sr-only">
          Workload summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Awaiting review</p>
            <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{workload.pendingReviewCount}</p>
          </Card>
          <Card className="p-4">
            <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Ageing (7+ days)</p>
            <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{workload.overdueReviewCount}</p>
          </Card>
          <Card className="p-4">
            <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Avg. turnaround</p>
            <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{workload.averageTurnaroundDays}d</p>
          </Card>
          <Card className="p-4">
            <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Reviewed (30d)</p>
            <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{workload.reviewsCompletedLast30Days}</p>
          </Card>
        </div>
      </section>

      {/* What requires attention */}
      <section aria-labelledby="attention-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="attention-heading" className="font-campus-sans text-campus-lg font-medium text-campus-text">
            What requires my attention
          </h2>
          <Link href="/faculty/evidence" className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-muted hover:text-campus-text">
            Full queue <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        {aging.length === 0 && needsRevision.length === 0 && pending.length === 0 ? (
          <EmptyState title="Nothing urgent" description="No Evidence is awaiting review or revision right now." />
        ) : (
          <div className="flex flex-col gap-2">
            {aging.map((entry) => (
              <Link key={entry.evidenceId} href={`/faculty/evidence/${entry.evidenceId}`}>
                <Card interactive className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <Badge tone="red">Ageing — {entry.ageDays}d</Badge>
                    <p className="font-campus-sans text-campus-sm text-campus-text">
                      <span className="font-medium">{entry.title}</span> · {entry.studentName}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
            {needsRevision.map((entry) => (
              <Link key={entry.evidenceId} href={`/faculty/evidence/${entry.evidenceId}`}>
                <Card interactive className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <Badge tone="amber">Revision requested</Badge>
                    <p className="font-campus-sans text-campus-sm text-campus-text">
                      <span className="font-medium">{entry.title}</span> · {entry.studentName}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
            {pending
              .filter((e) => e.ageDays <= 7)
              .map((entry) => (
                <Link key={entry.evidenceId} href={`/faculty/evidence/${entry.evidenceId}`}>
                  <Card interactive className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <Badge tone="blue">Awaiting review</Badge>
                      <p className="font-campus-sans text-campus-sm text-campus-text">
                        <span className="font-medium">{entry.title}</span> · {entry.studentName}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
          </div>
        )}
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent review activity */}
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
            What my recent reviews changed
          </h2>
          {recentDecisions.length === 0 ? (
            <Panel>
              <p className="font-campus-sans text-campus-sm text-campus-muted">No review decisions recorded yet.</p>
            </Panel>
          ) : (
            <div className="flex flex-col gap-2">
              {recentDecisions.map(({ decision }) => (
                <Panel key={decision.id} className="flex flex-col gap-1 p-4">
                  <p className="font-campus-sans text-campus-sm text-campus-text">{decision.rationale}</p>
                  <p className="font-campus-mono text-campus-xs text-campus-muted">{formatRelativeTime(decision.decidedAt)}</p>
                </Panel>
              ))}
            </div>
          )}
        </section>

        {/* Course context */}
        <section aria-labelledby="courses-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="courses-heading" className="font-campus-sans text-campus-lg font-medium text-campus-text">
              Course Evidence coverage
            </h2>
            <Link href="/faculty/courses" className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-muted hover:text-campus-text">
              All courses <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {courseGaps.map(({ courseId, courseLabel, gaps }) => (
              <Link key={courseId} href={`/faculty/courses/${courseId}`}>
                <Card interactive className="flex items-center justify-between p-4">
                  <p className="font-campus-sans text-campus-sm text-campus-text">{courseLabel}</p>
                  <Badge tone={gaps.length > 0 ? 'amber' : 'green'}>{gaps.length > 0 ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'}` : 'Coverage healthy'}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
