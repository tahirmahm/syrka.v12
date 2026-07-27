import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { FilterBar } from '@/components/ui/FilterBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { FacultyReviewQueueRow } from '@/components/faculty/FacultyReviewQueueRow'
import { FunnelVisual } from '@/components/visualizations/FunnelVisual'
import { mockFacultyRepository } from '@/lib/repositories'
import { facultyUser, courses } from '@/lib/mock-data/seed'
import type { EvidenceStatus, EvidenceSourceType } from '@/lib/campus-types'

export const metadata = { title: 'Evidence Review — Syrka Campus' }
export const dynamic = 'force-dynamic'

type StatusFilter = 'all' | EvidenceStatus
type SortOption = 'age' | 'recent'

function buildHref(current: Record<string, string>, overrides: Record<string, string>) {
  const params = new URLSearchParams({ ...current, ...overrides })
  for (const [key, value] of Object.entries(overrides)) {
    if (value === 'all' || value === 'age') params.delete(key)
  }
  const qs = params.toString()
  return qs ? `/faculty/evidence?${qs}` : '/faculty/evidence'
}

export default async function FacultyEvidenceQueuePage({
  searchParams,
}: {
  searchParams: { status?: string; course?: string; type?: string; sort?: string }
}) {
  const status = (searchParams.status ?? 'all') as StatusFilter
  const course = searchParams.course ?? 'all'
  const type = (searchParams.type ?? 'all') as 'all' | EvidenceSourceType
  const sort = (searchParams.sort ?? 'age') as SortOption
  const current = { status, course, type, sort }

  const [allEntries, assignments] = await Promise.all([
    mockFacultyRepository.listReviewQueue(facultyUser.id),
    mockFacultyRepository.listCourseAssignments(facultyUser.id),
  ])

  let entries = allEntries
  if (status !== 'all') entries = entries.filter((e) => e.status === status)
  if (course !== 'all') entries = entries.filter((e) => e.courseId === course)
  if (type !== 'all') entries = entries.filter((e) => e.sourceType === type)
  entries = [...entries].sort((a, b) => (sort === 'recent' ? new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime() : b.ageDays - a.ageDays))

  const assignedCourses = assignments.map((a) => courses.find((c) => c.id === a.courseId)).filter((c): c is NonNullable<typeof c> => Boolean(c))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Evidence Review"
        subtitle={`${allEntries.length} Evidence ${allEntries.length === 1 ? 'submission' : 'submissions'} across your courses.`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Evidence Review' }]} />}
      />

      {allEntries.length > 0 && (
        <section aria-labelledby="review-funnel-heading" className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
          <h2 id="review-funnel-heading" className="mb-3 font-campus-sans text-campus-sm font-medium text-campus-text">
            Review funnel
          </h2>
          <FunnelVisual
            stages={[
              { id: 'submitted', label: 'Submitted', count: allEntries.length },
              { id: 'pending', label: 'Awaiting review', count: allEntries.filter((e) => e.status === 'pending').length },
              { id: 'verified', label: 'Verified', count: allEntries.filter((e) => e.status === 'verified').length },
            ]}
            dataCaption={`Live counts across your assigned courses · ${allEntries.filter((e) => e.status === 'disputed').length} revision-requested and ${allEntries.filter((e) => e.status === 'revoked').length} revoked excluded from this funnel`}
          />
        </section>
      )}

      <div className="flex flex-col gap-3">
        <FilterBar
          label="Filter by status"
          options={[
            { label: 'All', href: buildHref(current, { status: 'all' }), active: status === 'all' },
            { label: 'Awaiting review', href: buildHref(current, { status: 'pending' }), active: status === 'pending' },
            { label: 'Revision requested', href: buildHref(current, { status: 'disputed' }), active: status === 'disputed' },
            { label: 'Verified', href: buildHref(current, { status: 'verified' }), active: status === 'verified' },
            { label: 'Revoked', href: buildHref(current, { status: 'revoked' }), active: status === 'revoked' },
          ]}
        />
        <FilterBar
          label="Filter by course"
          options={[
            { label: 'All courses', href: buildHref(current, { course: 'all' }), active: course === 'all' },
            ...assignedCourses.map((c) => ({ label: c.code, href: buildHref(current, { course: c.id }), active: course === c.id })),
          ]}
        />
        <FilterBar
          label="Sort"
          options={[
            { label: 'Oldest first', href: buildHref(current, { sort: 'age' }), active: sort === 'age' },
            { label: 'Most recent', href: buildHref(current, { sort: 'recent' }), active: sort === 'recent' },
          ]}
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title={allEntries.length === 0 ? 'No Evidence submitted yet' : 'No Evidence matches these filters'}
          description={allEntries.length === 0 ? 'Evidence from your courses will appear here once submitted.' : 'Try a different combination of filters.'}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <FacultyReviewQueueRow key={entry.evidenceId} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
