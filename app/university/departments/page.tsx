import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockUniversityRepository } from '@/lib/repositories'
import { universityAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Departments — Syrka Campus' }
export const dynamic = 'force-dynamic'

const HEALTH_LABEL = { on_track: 'On track', attention_needed: 'Attention needed', at_risk: 'At risk' } as const
const HEALTH_TONE = { on_track: 'green', attention_needed: 'amber', at_risk: 'red' } as const

export default async function UniversityDepartmentsPage() {
  const departments = await mockUniversityRepository.listDepartmentSummaries(universityAdministratorUser.institutionId)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Departments"
        subtitle={`${departments.length} department${departments.length === 1 ? '' : 's'} in this institution.`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/university' }, { label: 'Departments' }]} />}
      />

      {departments.length === 0 ? (
        <EmptyState title="No departments" />
      ) : (
        <div className="flex flex-col gap-2">
          {departments.map((d) => (
            <Link key={d.departmentId} href={`/university/departments/${d.departmentId}`}>
              <Card interactive className="flex flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-campus-sans text-campus-base font-medium text-campus-text">{d.departmentName}</p>
                  <Badge tone={HEALTH_TONE[d.evidenceHealthLabel]}>{HEALTH_LABEL[d.evidenceHealthLabel]}</Badge>
                </div>
                <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">
                  {d.programmeCount} programme{d.programmeCount === 1 ? '' : 's'} · {d.studentCount} student{d.studentCount === 1 ? '' : 's'} · {d.facultyCount} Faculty
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{d.intendedCapabilityCount} intended Capabilities</Badge>
                  <Badge tone="neutral">{d.observedCapabilityCoveragePercent}% observed coverage</Badge>
                  <Badge tone={d.reviewCapacityConstrained ? 'amber' : 'green'}>{d.reviewCapacityConstrained ? 'Capacity constrained' : 'Capacity healthy'}</Badge>
                  <Badge tone={d.governanceConcernCount > 0 ? 'amber' : 'neutral'}>{d.governanceConcernCount} governance concern(s)</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
