import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FacultyCourseCoverageTable } from '@/components/faculty/FacultyCourseCoverageTable'
import { FacultyReviewQueueRow } from '@/components/faculty/FacultyReviewQueueRow'
import { mockFacultyRepository } from '@/lib/repositories'
import { facultyUser, courses } from '@/lib/mock-data/seed'

async function loadCourse(courseId: string) {
  const assignments = await mockFacultyRepository.listCourseAssignments(facultyUser.id)
  const assignment = assignments.find((a) => a.courseId === courseId)
  const course = courses.find((c) => c.id === courseId)
  if (!assignment || !course) return undefined
  return { assignment, course }
}

export async function generateMetadata({ params }: { params: { courseId: string } }) {
  const loaded = await loadCourse(params.courseId)
  if (!loaded) notFound()
  return { title: `${loaded.course.code} ${loaded.course.title} — Syrka Campus` }
}

export default async function FacultyCourseDetailPage({ params }: { params: { courseId: string } }) {
  const loaded = await loadCourse(params.courseId)
  if (!loaded) notFound()
  const { assignment, course } = loaded

  const [coverage, queue] = await Promise.all([
    mockFacultyRepository.getCourseCapabilityCoverage(course.id),
    mockFacultyRepository.listReviewQueue(facultyUser.id, { courseId: course.id }),
  ])

  const studentsRequiringAttention = queue.filter((e) => e.status === 'pending' || e.status === 'disputed')
  const gaps = coverage.filter((c) => c.evidenceProducedCount === 0)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title={`${course.code} · ${course.title}`}
        subtitle={`${assignment.role.replace('_', ' ')} · ${assignment.term}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Courses', href: '/faculty/courses' }, { label: course.code }]} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Capabilities addressed</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{coverage.length}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Awaiting review</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{queue.filter((e) => e.status === 'pending').length}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Coverage gaps</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{gaps.length}</p>
        </div>
      </div>

      <section aria-labelledby="coverage-heading">
        <h2 id="coverage-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Capability coverage
        </h2>
        <p className="mb-3 font-campus-sans text-campus-sm text-campus-muted">
          Completing this course does not, by itself, prove a capability — coverage below reflects Evidence actually produced and reviewed, not enrollment or grades.
        </p>
        <FacultyCourseCoverageTable coverage={coverage} />
      </section>

      <section aria-labelledby="attention-heading">
        <h2 id="attention-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Students requiring attention
        </h2>
        {studentsRequiringAttention.length === 0 ? (
          <EmptyState title="Nothing pending" description="No Evidence in this course currently needs review or revision." />
        ) : (
          <div className="flex flex-col gap-2">
            {studentsRequiringAttention.map((entry) => (
              <FacultyReviewQueueRow key={entry.evidenceId} entry={entry} />
            ))}
          </div>
        )}
      </section>

      {gaps.length > 0 && (
        <section aria-labelledby="gaps-heading">
          <h2 id="gaps-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
            Common Evidence gaps
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {gaps.map((g) => (
              <Badge key={g.capabilityId} tone="amber">
                {g.capabilityName}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
