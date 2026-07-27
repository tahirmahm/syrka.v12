import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockDepartmentRepository } from '@/lib/repositories'
import { departmentAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Courses — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function DepartmentCoursesPage() {
  const departmentId = departmentAdministratorUser.administratorScope!.departmentId!
  const rows = await mockDepartmentRepository.listCourseAdminSummaries(departmentId)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Courses"
        subtitle={`${rows.length} ${rows.length === 1 ? 'course' : 'courses'} across this department's programmes — the departmental view of curriculum and Capability architecture, not the Faculty teaching view.`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/department' }, { label: 'Courses' }]} />}
      />

      {rows.length === 0 ? (
        <EmptyState title="No courses" description="This department has no courses on record." />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((c) => (
            <Link key={c.courseId} href={`/department/courses/${c.courseId}`}>
              <Card interactive className="flex flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-campus-sans text-campus-base font-medium text-campus-text">
                    {c.courseCode} · {c.courseTitle}
                  </p>
                  <Badge tone="neutral">{c.term}</Badge>
                </div>
                <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">
                  {c.programmeName} · {c.responsibleFacultyNames.join(', ') || 'Unassigned'} · {c.enrolledStudentCount} enrolled
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{c.intendedCapabilityCount} intended Capabilities</Badge>
                  <Badge tone="neutral">
                    {c.evidenceProducingAssessmentCount}/{c.totalAssessmentCount} assessments producing Evidence
                  </Badge>
                  <Badge tone={c.unresolvedEvidenceCount > 0 ? 'blue' : 'neutral'}>{c.unresolvedEvidenceCount} unresolved Evidence</Badge>
                  <Badge tone={c.reviewCompletionPercent === 100 ? 'green' : 'amber'}>{c.reviewCompletionPercent}% review completion</Badge>
                  {c.activeInterventionCount > 0 && (
                    <Badge tone="purple">
                      {c.activeInterventionCount} active intervention{c.activeInterventionCount === 1 ? '' : 's'}
                    </Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
