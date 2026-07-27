import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CoverageTable } from '@/components/department/CoverageTable'
import { mockDepartmentRepository } from '@/lib/repositories'

export async function generateMetadata({ params }: { params: { courseId: string } }) {
  const course = await mockDepartmentRepository.getCourseAdminDetail(params.courseId)
  if (!course) notFound()
  return { title: `${course.courseCode} ${course.courseTitle} — Syrka Campus` }
}

export default async function DepartmentCourseDetailPage({ params }: { params: { courseId: string } }) {
  const course = await mockDepartmentRepository.getCourseAdminDetail(params.courseId)
  if (!course) notFound()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title={`${course.courseCode} · ${course.courseTitle}`}
        subtitle={`${course.programmeName} · ${course.term} · ${course.responsibleFacultyNames.join(', ') || 'Unassigned'}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/department' }, { label: 'Courses', href: '/department/courses' }, { label: course.courseCode }]} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Enrolled students</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{course.enrolledStudentCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Assessments producing Evidence</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">
            {course.evidenceProducingAssessmentCount}/{course.totalAssessmentCount}
          </p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Review completion</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{course.reviewCompletionPercent}%</p>
        </div>
      </div>

      {course.outcomeTitles.length > 0 && (
        <section aria-labelledby="outcomes-heading">
          <h2 id="outcomes-heading" className="mb-2 font-campus-sans text-campus-lg font-medium text-campus-text">
            Contributes to programme outcomes
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {course.outcomeTitles.map((title) => (
              <Badge key={title} tone="blue">
                {title}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="coverage-heading">
        <h2 id="coverage-heading" className="mb-1 font-campus-sans text-campus-lg font-medium text-campus-text">
          Intended vs. observed Capability coverage
        </h2>
        <p className="mb-3 font-campus-sans text-campus-sm text-campus-muted">
          The Department&apos;s perspective on this course as part of a wider programme and Capability architecture — distinct from the Faculty teaching/review view.
        </p>
        <CoverageTable rows={course.coverage} />
      </section>

      <section aria-labelledby="limitations-heading">
        <h2 id="limitations-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Common review limitations noted
        </h2>
        {course.commonLimitations.length === 0 ? (
          <EmptyState title="No recurring limitations" description="Faculty reviews of this course's Evidence haven't flagged any recurring limitation." />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {course.commonLimitations.map((l) => (
              <Badge key={l} tone="amber">
                {l.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="interventions-heading">
        <h2 id="interventions-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Intervention history
        </h2>
        {course.interventions.length === 0 ? (
          <EmptyState title="No interventions for this course" />
        ) : (
          <div className="flex flex-col gap-2">
            {course.interventions.map((i) => (
              <Card key={i.id} className="flex flex-col gap-1 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{i.title}</p>
                  <Badge tone="neutral">{i.status.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="font-campus-sans text-campus-xs text-campus-muted">{i.rationale}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
