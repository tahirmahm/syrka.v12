import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockFacultyRepository } from '@/lib/repositories'
import { facultyUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Students — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function FacultyStudentsPage() {
  const students = await mockFacultyRepository.listFacultyStudents(facultyUser.id)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Students"
        subtitle={`${students.length} ${students.length === 1 ? 'student' : 'students'} across your courses.`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Students' }]} />}
      />
      <p className="font-campus-sans text-campus-sm text-campus-muted">
        This demonstration dataset models a single student. A real institution would list every student enrolled in your courses here.
      </p>

      {students.length === 0 ? (
        <EmptyState title="No students yet" description="Students enrolled in your courses will appear here." />
      ) : (
        <div className="flex flex-col gap-2">
          {students.map((s) => (
            <Link key={s.studentId} href={`/faculty/students/${s.studentId}`}>
              <Card interactive className="flex items-center justify-between p-5">
                <div>
                  <p className="font-campus-sans text-campus-base font-medium text-campus-text">{s.studentName}</p>
                  <p className="font-campus-mono text-campus-xs text-campus-muted">{s.programmeName}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {s.pendingEvidenceCount > 0 && <Badge tone="blue">{s.pendingEvidenceCount} pending</Badge>}
                  {s.evidenceNeedingRevisionCount > 0 && <Badge tone="amber">{s.evidenceNeedingRevisionCount} needs revision</Badge>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
