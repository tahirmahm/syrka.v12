import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Panel } from '@/components/ui/Panel'
import { Status } from '@/components/ui/Status'
import { Badge } from '@/components/ui/Badge'
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter'
import { mockEvidenceRepository, mockCapabilityRepository, mockInstitutionRepository } from '@/lib/repositories'
import { currentUser, facultyUser } from '@/lib/mock-data/seed'
import { SOURCE_TYPE_LABELS } from '@/lib/constants/evidence'
import { formatDate, formatRelativeTime } from '@/lib/utilities/format-relative-time'

export async function generateMetadata({ params }: { params: { evidenceId: string } }) {
  const item = await mockEvidenceRepository.get(params.evidenceId)
  if (!item || item.record.studentId !== currentUser.id) notFound()
  return { title: `${item.record.title} — Syrka Campus` }
}

export default async function EvidenceDetailPage({ params }: { params: { evidenceId: string } }) {
  const item = await mockEvidenceRepository.get(params.evidenceId)
  if (!item || item.record.studentId !== currentUser.id) notFound()

  const { record, review } = item

  const [predecessor, supersedingRecord, courses] = await Promise.all([
    record.supersedesEvidenceId ? mockEvidenceRepository.get(record.supersedesEvidenceId) : Promise.resolve(undefined),
    mockEvidenceRepository.getSupersedingRecord(record.id),
    currentUser.programmeId ? mockInstitutionRepository.listCourses(currentUser.programmeId) : Promise.resolve([]),
  ])

  const courseInfo = courses.find((c) => c.id === record.courseId)

  const linkedCapabilities = await Promise.all(
    record.capabilityIds.map(async (capId) => ({
      definition: await mockCapabilityRepository.getDefinition(capId),
      claim: await mockCapabilityRepository.getClaimForCapability(currentUser.id, capId),
    }))
  )

  const reviewer = review.reviewedBy === facultyUser.id ? facultyUser : undefined

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title={record.title}
        subtitle={`${SOURCE_TYPE_LABELS[record.sourceType]}${courseInfo ? ` · ${courseInfo.title}` : ''}`}
        breadcrumbs={
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Evidence', href: '/student/evidence' }, { label: record.title }]} />
        }
        actions={<Status tone={review.status} />}
      />

      {record.supersedesEvidenceId && predecessor && (
        <Panel className="flex items-center gap-2">
          <ArrowsClockwise size={16} className="text-campus-muted" aria-hidden="true" />
          <p className="font-campus-sans text-campus-sm text-campus-text">
            This is a revision of{' '}
            <Link href={`/student/evidence/${predecessor.record.id}`} className="underline hover:text-campus-muted">
              {predecessor.record.title}
            </Link>
            .
          </p>
        </Panel>
      )}
      {supersedingRecord && (
        <Panel className="flex items-center gap-2">
          <ArrowsClockwise size={16} className="text-campus-muted" aria-hidden="true" />
          <p className="font-campus-sans text-campus-sm text-campus-text">
            This evidence was superseded by{' '}
            <Link href={`/student/evidence/${supersedingRecord.record.id}`} className="underline hover:text-campus-muted">
              {supersedingRecord.record.title}
            </Link>
            .
          </p>
        </Panel>
      )}

      <Panel className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-4 text-campus-sm">
          <div>
            <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Submitted</dt>
            <dd className="mt-0.5 text-campus-text">
              <time dateTime={record.submittedAt}>{formatDate(record.submittedAt)}</time> ({formatRelativeTime(record.submittedAt)})
            </dd>
          </div>
          <div>
            <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Source</dt>
            <dd className="mt-0.5 text-campus-text">{record.provenance}</dd>
          </div>
          {review.reviewedAt && (
            <div>
              <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Reviewed</dt>
              <dd className="mt-0.5 text-campus-text">{formatDate(review.reviewedAt)}</dd>
            </div>
          )}
          {reviewer && (
            <div>
              <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Reviewer</dt>
              <dd className="mt-0.5 text-campus-text">{reviewer.name}</dd>
            </div>
          )}
        </dl>
        {review.rationale ? (
          <div className="border-t border-campus-border pt-4">
            <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Review rationale</p>
            <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">{review.rationale}</p>
          </div>
        ) : (
          <div className="border-t border-campus-border pt-4">
            <p className="font-campus-sans text-campus-sm text-campus-muted">Not yet reviewed — no rationale available.</p>
          </div>
        )}
      </Panel>

      <section aria-labelledby="linked-capabilities-heading">
        <h2 id="linked-capabilities-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Linked capabilities
        </h2>
        <div className="flex flex-col gap-3">
          {linkedCapabilities.map(({ definition, claim }) =>
            definition ? (
              <Panel key={definition.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Link href={`/student/capabilities/${definition.id}`} className="font-campus-sans text-campus-sm font-medium text-campus-text hover:underline">
                    {definition.name}
                  </Link>
                  {claim && <Badge tone="neutral">{claim.maturity}</Badge>}
                </div>
                {claim ? (
                  <ConfidenceMeter
                    confidence={claim.confidence}
                    explanation={
                      review.status === 'verified'
                        ? 'This verified evidence currently contributes to this capability’s confidence.'
                        : 'This evidence does not yet contribute to confidence — it is pending review.'
                    }
                  />
                ) : (
                  <p className="font-campus-sans text-campus-sm text-campus-muted">No current claim for this capability.</p>
                )}
              </Panel>
            ) : null
          )}
        </div>
      </section>
    </div>
  )
}
