import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { FilterBar } from '@/components/ui/FilterBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EvidenceRow } from '@/components/evidence/EvidenceRow'
import { mockEvidenceRepository, mockCapabilityRepository, mockInstitutionRepository } from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'
import type { EvidenceStatus, EvidenceSourceType } from '@/lib/campus-types'
import { getStudentIdentity } from '@/lib/utilities/student-identity-projection'
import { getClassXEvidenceChains, getClassXNeedsActionItems, type ClassXEvidenceChainRecord } from '@/lib/utilities/class10-evidence-projection'
import { formatDate, formatRelativeTime } from '@/lib/utilities/format-relative-time'

export const metadata = { title: 'Evidence — Syrka Campus' }

type StatusFilter = 'all' | EvidenceStatus
type TypeFilter = 'all' | 'course' | EvidenceSourceType
type SortOption = 'recent' | 'contribution'

function buildHref(current: Record<string, string>, overrides: Record<string, string>) {
  const params = new URLSearchParams({ ...current, ...overrides })
  for (const [key, value] of Object.entries(overrides)) {
    if (value === 'all' || value === 'recent') params.delete(key)
  }
  const qs = params.toString()
  return qs ? `/student/evidence?${qs}` : '/student/evidence'
}

type ClassXTab = 'needs_action' | 'observations' | 'candidates' | 'awaiting_review' | 'accepted' | 'needs_revision' | 'revoked'

function classXTabHref(tab: ClassXTab) {
  return tab === 'accepted' ? '/student/evidence' : `/student/evidence?tab=${tab}`
}

function EvidenceChainCard({ record }: { record: ClassXEvidenceChainRecord }) {
  return (
    <Link href={`/student/evidence/${record.id}`}>
      <Card interactive className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{record.conceptTitle}</p>
            <p className="mt-0.5 font-campus-mono text-campus-xs text-campus-muted">
              {record.subject} — {record.chapterTitle}
            </p>
          </div>
          <Badge tone="green">{record.lifecycleLabel}</Badge>
        </div>
        <p className="font-campus-sans text-campus-xs text-campus-muted">{record.candidateRationale}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral">{record.capabilityName}</Badge>
          {record.reviewedAt && (
            <span className="font-campus-mono text-[10px] text-campus-muted">
              Reviewed {formatDate(record.reviewedAt)} ({formatRelativeTime(record.reviewedAt)})
            </span>
          )}
        </div>
      </Card>
    </Link>
  )
}

async function ClassXStudentEvidencePage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = (searchParams.tab ?? 'accepted') as ClassXTab
  const chains = getClassXEvidenceChains()
  const needsAction = getClassXNeedsActionItems()
  const observations = chains.flatMap((r) => r.observations.map((o) => ({ ...o, record: r })))

  const counts: Record<ClassXTab, number> = {
    needs_action: needsAction.length,
    observations: observations.length,
    candidates: chains.length,
    awaiting_review: 0,
    accepted: chains.length,
    needs_revision: 0,
    revoked: 0,
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Evidence"
        subtitle={`${chains.length} accepted Evidence ${chains.length === 1 ? 'record' : 'records'}, built from real concept attempts — never a chapter-completion badge.`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Evidence' }]} />}
      />

      <FilterBar
        label="View"
        options={[
          { label: `Needs action (${counts.needs_action})`, href: classXTabHref('needs_action'), active: tab === 'needs_action' },
          { label: `Learning Observations (${counts.observations})`, href: classXTabHref('observations'), active: tab === 'observations' },
          { label: `Evidence candidates (${counts.candidates})`, href: classXTabHref('candidates'), active: tab === 'candidates' },
          { label: `Awaiting review (${counts.awaiting_review})`, href: classXTabHref('awaiting_review'), active: tab === 'awaiting_review' },
          { label: `Accepted Evidence (${counts.accepted})`, href: classXTabHref('accepted'), active: tab === 'accepted' },
          { label: `Needs revision (${counts.needs_revision})`, href: classXTabHref('needs_revision'), active: tab === 'needs_revision' },
          { label: `Revoked or superseded (${counts.revoked})`, href: classXTabHref('revoked'), active: tab === 'revoked' },
        ]}
      />

      {tab === 'needs_action' && (
        needsAction.length === 0 ? (
          <EmptyState title="Nothing needs action" description="Every subject currently has an open recommendation completed." />
        ) : (
          <div className="flex flex-col gap-2">
            {needsAction.map((item) => (
              <Link key={item.conceptId} href={item.href}>
                <Card interactive className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{item.conceptTitle}</p>
                    <p className="mt-0.5 font-campus-mono text-campus-xs text-campus-muted">{item.subject} — {item.chapterTitle}</p>
                    <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">{item.reason}</p>
                  </div>
                  <Badge tone="blue">Continue activity</Badge>
                </Card>
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'observations' && (
        <div className="flex flex-col gap-2">
          {observations.map((o) => (
            <Link key={o.id} href={o.record.sourceHref}>
              <Card interactive className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{o.description}</p>
                  <p className="mt-0.5 font-campus-mono text-campus-xs text-campus-muted">
                    {o.record.subject} — {o.record.conceptTitle} · {formatDate(o.recordedAt)}
                  </p>
                </div>
                <Badge tone="neutral">{o.independenceLevel.replace(/_/g, ' ')}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {tab === 'candidates' && (
        <div className="flex flex-col gap-2">
          {chains.map((r) => (
            <Link key={r.id} href={`/student/evidence/${r.id}`}>
              <Card interactive className="flex flex-col gap-2 p-4">
                <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{r.conceptTitle}</p>
                <p className="font-campus-sans text-campus-xs text-campus-muted">{r.candidateRationale}</p>
                <p className="font-campus-mono text-[10px] text-campus-muted">Submitted {formatDate(r.candidateSubmittedAt)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {tab === 'awaiting_review' && (
        <EmptyState title="Nothing awaiting review" description="Every Evidence candidate submitted so far in this demonstration has already been reviewed by Faculty." />
      )}

      {tab === 'accepted' && (
        <div className="flex flex-col gap-2">
          {chains.map((r) => (
            <EvidenceChainCard key={r.id} record={r} />
          ))}
        </div>
      )}

      {tab === 'needs_revision' && (
        <EmptyState title="Nothing needs revision" description="No accepted Evidence candidate in this demonstration has been sent back for revision." />
      )}

      {tab === 'revoked' && (
        <EmptyState title="Nothing revoked or superseded" description="No Evidence in this demonstration has been revoked or superseded by a later submission." />
      )}
    </div>
  )
}

export default async function StudentEvidencePage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; sort?: string; tab?: string }
}) {
  const identity = getStudentIdentity(currentUser.id)
  if (identity.stage === 'secondary_class_10') {
    return <ClassXStudentEvidencePage searchParams={searchParams} />
  }

  const status = (searchParams.status ?? 'all') as StatusFilter
  const type = (searchParams.type ?? 'all') as TypeFilter
  const sort = (searchParams.sort ?? 'recent') as SortOption
  const current = { status, type, sort }

  const [evidence, capabilityDefinitions, courses] = await Promise.all([
    mockEvidenceRepository.listForStudent(currentUser.id),
    mockCapabilityRepository.listDefinitions(),
    currentUser.programmeId ? mockInstitutionRepository.listCourses(currentUser.programmeId) : Promise.resolve([]),
  ])

  const capabilityClaims = await mockCapabilityRepository.listClaimsForSubject(currentUser.id)
  const confidenceByCapability = new Map(capabilityClaims.map((c) => [c.capabilityId, c.confidence.score]))

  let filtered = evidence
  if (status !== 'all') filtered = filtered.filter((e) => e.review.status === status)
  if (type === 'course') filtered = filtered.filter((e) => Boolean(e.record.courseId))
  else if (type !== 'all') filtered = filtered.filter((e) => e.record.sourceType === type)

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'contribution') {
      const scoreA = a.review.status === 'verified' ? Math.max(...a.record.capabilityIds.map((id) => confidenceByCapability.get(id) ?? 0), 0) : 0
      const scoreB = b.review.status === 'verified' ? Math.max(...b.record.capabilityIds.map((id) => confidenceByCapability.get(id) ?? 0), 0) : 0
      return scoreB - scoreA
    }
    return new Date(b.record.submittedAt).getTime() - new Date(a.record.submittedAt).getTime()
  })

  const courseById = new Map(courses.map((c) => [c.id, c]))
  const capabilityById = new Map(capabilityDefinitions.map((c) => [c.id, c]))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Evidence"
        subtitle={`${evidence.length} evidence ${evidence.length === 1 ? 'record' : 'records'} across your coursework and achievements.`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Evidence' }]} />}
      />

      <div className="flex flex-col gap-3">
        <FilterBar
          label="Filter by status"
          options={[
            { label: 'All evidence', href: buildHref(current, { status: 'all' }), active: status === 'all' },
            { label: 'Verified', href: buildHref(current, { status: 'verified' }), active: status === 'verified' },
            { label: 'Awaiting review', href: buildHref(current, { status: 'pending' }), active: status === 'pending' },
            { label: 'Needs revision', href: buildHref(current, { status: 'disputed' }), active: status === 'disputed' },
            { label: 'Revoked', href: buildHref(current, { status: 'revoked' }), active: status === 'revoked' },
          ]}
        />
        <FilterBar
          label="Filter by source"
          options={[
            { label: 'All sources', href: buildHref(current, { type: 'all' }), active: type === 'all' },
            { label: 'Course-derived', href: buildHref(current, { type: 'course' }), active: type === 'course' },
            { label: 'Project-derived', href: buildHref(current, { type: 'project' }), active: type === 'project' },
            { label: 'Assessment-derived', href: buildHref(current, { type: 'assessment' }), active: type === 'assessment' },
          ]}
        />
        <FilterBar
          label="Sort"
          options={[
            { label: 'Most recent', href: buildHref(current, { sort: 'recent' }), active: sort === 'recent' },
            { label: 'Highest contribution', href: buildHref(current, { sort: 'contribution' }), active: sort === 'contribution' },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={evidence.length === 0 ? 'No evidence yet' : 'No evidence matches these filters'}
          description={evidence.length === 0 ? 'Submitted coursework and achievements will appear here once recorded.' : 'Try a different combination of filters.'}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <EvidenceRow
              key={item.record.id}
              item={item}
              course={item.record.courseId ? courseById.get(item.record.courseId) : undefined}
              capabilities={item.record.capabilityIds.map((id) => capabilityById.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
