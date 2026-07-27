import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockDepartmentRepository } from '@/lib/repositories'
import { departmentAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Programmes — Syrka Campus' }
export const dynamic = 'force-dynamic'

const REVIEW_HEALTH_LABEL = { on_track: 'On track', attention_needed: 'Attention needed', at_risk: 'At risk' } as const
const REVIEW_HEALTH_TONE = { on_track: 'green', attention_needed: 'amber', at_risk: 'red' } as const

export default async function DepartmentProgrammesPage() {
  const departmentId = departmentAdministratorUser.administratorScope!.departmentId!
  const programmes = await mockDepartmentRepository.listProgrammeHealth(departmentId)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Programmes"
        subtitle={`${programmes.length} ${programmes.length === 1 ? 'programme' : 'programmes'} in this department.`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/department' }, { label: 'Programmes' }]} />}
      />

      {programmes.length === 0 ? (
        <EmptyState title="No programmes" description="This department has no programmes on record." />
      ) : (
        <div className="flex flex-col gap-2">
          {programmes.map((p) => (
            <Link key={p.programmeId} href={`/department/programmes/${p.programmeId}`}>
              <Card interactive className="flex flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-campus-sans text-campus-base font-medium text-campus-text">{p.programmeName}</p>
                  <Badge tone={REVIEW_HEALTH_TONE[p.reviewHealth]}>{REVIEW_HEALTH_LABEL[p.reviewHealth]}</Badge>
                </div>
                <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">
                  {p.degreeLevel} · {p.activeTerm} · {p.cohortSize} enrolled
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{p.intendedCapabilityCount} intended Capability domains</Badge>
                  <Badge tone="neutral">{p.observedCapabilityCoveragePercent}% observed coverage</Badge>
                  <Badge tone="neutral">
                    {p.evidenceProducingCourseCount}/{p.totalCourseCount} courses producing Evidence
                  </Badge>
                  <Badge tone={p.unresolvedEvidenceCount > 0 ? 'blue' : 'neutral'}>{p.unresolvedEvidenceCount} unresolved Evidence</Badge>
                  <Badge tone={p.gapCount > 0 ? 'amber' : 'green'}>{p.gapCount > 0 ? `${p.gapCount} gap${p.gapCount === 1 ? '' : 's'}` : 'No gaps'}</Badge>
                  <Badge tone={p.activeInterventionCount > 0 ? 'purple' : 'neutral'}>
                    {p.activeInterventionCount} active intervention{p.activeInterventionCount === 1 ? '' : 's'}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
