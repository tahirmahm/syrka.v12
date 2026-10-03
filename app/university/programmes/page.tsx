import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar } from '@/components/ui/FilterBar'
import { mockUniversityRepository } from '@/lib/repositories'
import { universityAdministratorUser } from '@/lib/mock-data/seed'
import type { ReviewHealthLabel } from '@/lib/campus-types'

export const metadata = { title: 'Programme Portfolio — Syrka Campus' }
export const dynamic = 'force-dynamic'

const HEALTH_LABEL: Record<ReviewHealthLabel, string> = { on_track: 'On track', attention_needed: 'Attention needed', at_risk: 'At risk' }
const HEALTH_TONE = { on_track: 'green', attention_needed: 'amber', at_risk: 'red' } as const

export default async function UniversityProgrammesPage({ searchParams }: { searchParams: { reviewHealth?: string } }) {
  const allEntries = await mockUniversityRepository.listProgrammePortfolio(universityAdministratorUser.institutionId)
  const activeFilter = searchParams.reviewHealth
  const entries = activeFilter && activeFilter !== 'all' ? allEntries.filter((e) => e.reviewHealth === activeFilter) : allEntries

  const filterOptions = [
    { label: 'All', href: '/university/programmes', active: !activeFilter || activeFilter === 'all' },
    ...(['on_track', 'attention_needed', 'at_risk'] as const).map((h) => ({
      label: HEALTH_LABEL[h],
      href: `/university/programmes?reviewHealth=${h}`,
      active: activeFilter === h,
    })),
  ]

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Programme Portfolio"
        subtitle="Institution-wide programme intelligence, reusing canonical Department data rather than duplicating it."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/university' }, { label: 'Programmes' }]} />}
      />

      <FilterBar label="Filter by review health" options={filterOptions} />

      {entries.length === 0 ? (
        <EmptyState title="No programmes match this filter" />
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((p) => (
            <Card key={p.programmeId} className="flex flex-col gap-2 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-campus-sans text-campus-base font-medium text-campus-text">{p.programmeName}</p>
                <Badge tone={HEALTH_TONE[p.reviewHealth]}>{HEALTH_LABEL[p.reviewHealth]}</Badge>
              </div>
              <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">
                <Link href={`/university/departments/${p.departmentId}`} className="hover:underline">
                  {p.departmentName}
                </Link>{' '}
                · {p.degreeLevel} · {p.cohortSize} enrolled
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="neutral">{p.intendedCapabilityCount} intended Capabilities</Badge>
                <Badge tone="neutral">{p.observedCapabilityCoveragePercent}% observed coverage</Badge>
                <Badge tone="neutral">
                  {p.evidenceProducingCourseCount}/{p.totalCourseCount} courses producing Evidence
                </Badge>
                <Badge tone={p.curriculumAlignmentIssueCount > 0 ? 'amber' : 'green'}>
                  {p.curriculumAlignmentIssueCount > 0 ? `${p.curriculumAlignmentIssueCount} alignment issue(s)` : 'Aligned'}
                </Badge>
                <Badge tone={p.odysseyBlockerCount > 0 ? 'blue' : 'neutral'}>{p.odysseyBlockerCount} Odyssey blocker(s)</Badge>
                <Badge tone={p.passportReadinessBlockerCount > 0 ? 'blue' : 'neutral'}>{p.passportReadinessBlockerCount} Passport blocker(s)</Badge>
                <Badge tone={p.interventionStatus === 'none' ? 'neutral' : 'purple'}>{p.interventionStatus === 'none' ? 'No intervention' : p.interventionStatus.replace(/_/g, ' ')}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
