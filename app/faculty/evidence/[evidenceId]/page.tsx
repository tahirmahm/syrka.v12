import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { Status } from '@/components/ui/Status'
import { FacultyReviewWorkspace } from '@/components/faculty/FacultyReviewWorkspace'
import { mockFacultyRepository } from '@/lib/repositories'
import { facultyUser } from '@/lib/mock-data/seed'
import { SOURCE_TYPE_LABELS } from '@/lib/constants/evidence'
import { DECISION_TYPE_TONES, DECISION_TYPE_LABELS } from '@/lib/constants/faculty'
import { formatDate, formatRelativeTime } from '@/lib/utilities/format-relative-time'
import type { ReviewDecisionType } from '@/lib/campus-types'

const DECISION_TYPES: ReviewDecisionType[] = ['approve', 'request_revision', 'request_clarification', 'dispute_attribution', 'revoke', 'confirm_supersession']

async function loadDetail(evidenceId: string) {
  const assignments = await mockFacultyRepository.listCourseAssignments(facultyUser.id)
  const assignedCourseIds = new Set(assignments.map((a) => a.courseId))
  const detail = await mockFacultyRepository.getEvidenceReviewDetail(evidenceId)
  if (!detail) return undefined
  if (detail.item.record.courseId && !assignedCourseIds.has(detail.item.record.courseId)) return undefined
  return detail
}

export async function generateMetadata({ params }: { params: { evidenceId: string } }) {
  const detail = await loadDetail(params.evidenceId)
  if (!detail) notFound()
  return { title: `${detail.item.record.title} — Faculty Review — Syrka Campus` }
}

export default async function FacultyEvidenceReviewPage({ params }: { params: { evidenceId: string } }) {
  const detail = await loadDetail(params.evidenceId)
  if (!detail) notFound()

  const { item, effectiveStatus, studentName, courseLabel, linkedCapabilities, criteria, history, priorVersion, supersedingVersion } = detail
  const { record } = item

  const impactPreviewEntries = await Promise.all(DECISION_TYPES.map(async (type) => [type, await mockFacultyRepository.computeImpactPreview(record.id, type)] as const))
  const impactPreviewByDecision = Object.fromEntries(impactPreviewEntries) as Record<ReviewDecisionType, (typeof impactPreviewEntries)[number][1]>

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title={record.title}
        subtitle={`${studentName} · ${courseLabel ?? SOURCE_TYPE_LABELS[record.sourceType]}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Evidence Review', href: '/faculty/evidence' }, { label: record.title }]} />}
        actions={<Status tone={effectiveStatus} />}
      />

      {record.supersedesEvidenceId && priorVersion && (
        <Panel className="flex items-center gap-2">
          <ArrowsClockwise size={16} className="text-campus-muted" aria-hidden="true" />
          <p className="font-campus-sans text-campus-sm text-campus-text">
            This is a revision of{' '}
            <Link href={`/faculty/evidence/${priorVersion.record.id}`} className="underline hover:text-campus-muted">
              {priorVersion.record.title}
            </Link>
            .
          </p>
        </Panel>
      )}
      {supersedingVersion && (
        <Panel className="flex items-center gap-2">
          <ArrowsClockwise size={16} className="text-campus-muted" aria-hidden="true" />
          <p className="font-campus-sans text-campus-sm text-campus-text">
            A newer submission,{' '}
            <Link href={`/faculty/evidence/${supersedingVersion.record.id}`} className="underline hover:text-campus-muted">
              {supersedingVersion.record.title}
            </Link>
            , supersedes this one.
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
            <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Evidence type</dt>
            <dd className="mt-0.5 text-campus-text">{SOURCE_TYPE_LABELS[record.sourceType]}</dd>
          </div>
          <div className="col-span-2">
            <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Provenance</dt>
            <dd className="mt-0.5 text-campus-text">{record.provenance}</dd>
          </div>
        </dl>
      </Panel>

      {criteria.length > 0 && (
        <section aria-labelledby="criteria-heading">
          <h2 id="criteria-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
            Review criteria
          </h2>
          <div className="flex flex-col gap-2">
            {criteria.map((c) => {
              const linked = linkedCapabilities.find((l) => l.id === c.capabilityId)
              return (
                <Panel key={c.id} className="p-4">
                  <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{linked?.name ?? c.capabilityId}</p>
                  <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">{c.description}</p>
                  {c.expectedMaturity && <p className="mt-1 font-campus-mono text-campus-xs text-campus-muted">Expected maturity: {c.expectedMaturity}</p>}
                </Panel>
              )
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="capabilities-heading">
        <h2 id="capabilities-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Linked capability claims
        </h2>
        {linkedCapabilities.length === 0 ? (
          <p className="font-campus-sans text-campus-sm text-campus-muted">No capabilities linked to this Evidence.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {linkedCapabilities.map((c) => (
              <Panel key={c.id} className="flex items-center justify-between p-4">
                <p className="font-campus-sans text-campus-sm text-campus-text">{c.name}</p>
                <div className="flex items-center gap-1.5">
                  <Badge tone="neutral">{c.maturity ?? 'No claim'}</Badge>
                  {c.confidenceBand && <Badge tone="neutral">{c.confidenceBand}</Badge>}
                </div>
              </Panel>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Review history
        </h2>
        {history.length === 0 ? (
          <p className="font-campus-sans text-campus-sm text-campus-muted">Not yet reviewed.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map(({ decision }) => (
              <Panel key={decision.id} className="flex flex-col gap-1 p-4">
                <div className="flex items-center justify-between">
                  <Badge tone={DECISION_TYPE_TONES[decision.decisionType]}>{DECISION_TYPE_LABELS[decision.decisionType]}</Badge>
                  <span className="font-campus-mono text-campus-xs text-campus-muted">{formatRelativeTime(decision.decidedAt)}</span>
                </div>
                <p className="font-campus-sans text-campus-sm text-campus-text">{decision.rationale}</p>
              </Panel>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="decision-heading">
        <h2 id="decision-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Record a review decision
        </h2>
        <FacultyReviewWorkspace
          evidenceId={record.id}
          studentName={studentName}
          linkedCapabilities={linkedCapabilities.map((c) => ({ id: c.id, name: c.name }))}
          impactPreviewByDecision={impactPreviewByDecision}
        />
      </section>
    </div>
  )
}
