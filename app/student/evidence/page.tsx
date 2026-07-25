import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { FilterBar } from '@/components/ui/FilterBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { EvidenceRow } from '@/components/evidence/EvidenceRow'
import { mockEvidenceRepository, mockCapabilityRepository, mockInstitutionRepository } from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'
import type { EvidenceStatus, EvidenceSourceType } from '@/lib/campus-types'

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

export default async function StudentEvidencePage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; sort?: string }
}) {
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
