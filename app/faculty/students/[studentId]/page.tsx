import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FacultyReviewQueueRow } from '@/components/faculty/FacultyReviewQueueRow'
import { mockFacultyRepository } from '@/lib/repositories'
import { facultyUser } from '@/lib/mock-data/seed'

async function loadStudent(studentId: string) {
  return mockFacultyRepository.getFacultyStudentDetail(facultyUser.id, studentId)
}

export async function generateMetadata({ params }: { params: { studentId: string } }) {
  const student = await loadStudent(params.studentId)
  if (!student) notFound()
  return { title: `${student.studentName} — Faculty — Syrka Campus` }
}

export default async function FacultyStudentDetailPage({ params }: { params: { studentId: string } }) {
  const student = await loadStudent(params.studentId)
  if (!student) notFound()

  const queue = await mockFacultyRepository.listReviewQueue(facultyUser.id, { studentId: student.studentId })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title={student.studentName}
        subtitle={student.programmeName}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Students', href: '/faculty/students' }, { label: student.studentName }]} />}
      />
      <p className="font-campus-sans text-campus-xs text-campus-muted">
        Showing only Evidence and capability context relevant to courses you teach — not the full Student dashboard.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel className="p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Evidence submitted</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{student.evidenceSubmittedCount}</p>
        </Panel>
        <Panel className="p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Pending review</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{student.pendingEvidenceCount}</p>
        </Panel>
        <Panel className="p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Needs revision</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{student.evidenceNeedingRevisionCount}</p>
        </Panel>
      </div>

      <section aria-labelledby="capabilities-heading">
        <h2 id="capabilities-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Capability claims in your courses
        </h2>
        {student.capabilityClaimsInFacultyCourses.length === 0 ? (
          <p className="font-campus-sans text-campus-sm text-campus-muted">No capability claims yet for capabilities addressed in your courses.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {student.capabilityClaimsInFacultyCourses.map((c) => (
              <Panel key={c.capabilityId} className="flex items-center justify-between p-4">
                <p className="font-campus-sans text-campus-sm text-campus-text">{c.capabilityName}</p>
                <div className="flex items-center gap-1.5">
                  <Badge tone="neutral">{c.maturity}</Badge>
                  <Badge tone="neutral">{c.confidence}</Badge>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </section>

      {student.odysseyMilestoneTitlesLinkedToFacultyCourses.length > 0 && (
        <section aria-labelledby="odyssey-heading">
          <h2 id="odyssey-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
            Odyssey milestones tied to your courses
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {student.odysseyMilestoneTitlesLinkedToFacultyCourses.map((title) => (
              <Badge key={title} tone="blue">
                {title}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="evidence-heading">
        <h2 id="evidence-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Evidence in your courses
        </h2>
        {queue.length === 0 ? (
          <EmptyState title="No Evidence yet" description="Evidence this student submits in your courses will appear here." />
        ) : (
          <div className="flex flex-col gap-2">
            {queue.map((entry) => (
              <FacultyReviewQueueRow key={entry.evidenceId} entry={entry} />
            ))}
          </div>
        )}
      </section>

      <Link href="/faculty/evidence" className="font-campus-sans text-campus-sm text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
        View full Evidence queue
      </Link>
    </div>
  )
}
