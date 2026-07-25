import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockFacultyRepository } from '@/lib/repositories'
import { facultyUser, courses } from '@/lib/mock-data/seed'

export const metadata = { title: 'Courses — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function FacultyCoursesPage() {
  const assignments = await mockFacultyRepository.listCourseAssignments(facultyUser.id)
  const queue = await mockFacultyRepository.listReviewQueue(facultyUser.id)

  const rows = await Promise.all(
    assignments.map(async (a) => {
      const course = courses.find((c) => c.id === a.courseId)
      const coverage = await mockFacultyRepository.getCourseCapabilityCoverage(a.courseId)
      const pending = queue.filter((e) => e.courseId === a.courseId && e.status === 'pending').length
      const gaps = coverage.filter((c) => c.evidenceProducedCount === 0).length
      return { assignment: a, course, pending, gaps, capabilityCount: coverage.length }
    })
  )

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Courses" subtitle={`${rows.length} ${rows.length === 1 ? 'course' : 'courses'} this term.`} breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Courses' }]} />} />

      {rows.length === 0 ? (
        <EmptyState title="No course assignments" description="You are not currently assigned to any courses." />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map(({ assignment, course, pending, gaps, capabilityCount }) =>
            course ? (
              <Link key={assignment.id} href={`/faculty/courses/${course.id}`}>
                <Card interactive className="flex flex-col gap-2 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-campus-sans text-campus-base font-medium text-campus-text">
                      {course.code} · {course.title}
                    </p>
                    <Badge tone="neutral">{assignment.term}</Badge>
                  </div>
                  <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">{assignment.role.replace('_', ' ')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={pending > 0 ? 'blue' : 'neutral'}>{pending} awaiting review</Badge>
                    <Badge tone={gaps > 0 ? 'amber' : 'green'}>{gaps > 0 ? `${gaps} coverage gap${gaps === 1 ? '' : 's'}` : 'Coverage healthy'}</Badge>
                    <Badge tone="neutral">{capabilityCount} capabilities addressed</Badge>
                  </div>
                </Card>
              </Link>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
