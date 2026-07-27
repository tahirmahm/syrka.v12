import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PriorityRow } from '@/components/university/PriorityRow'
import { mockInstitutionRepository, mockUniversityRepository } from '@/lib/repositories'
import { universityAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Institution — Syrka Campus' }
export const dynamic = 'force-dynamic'

const HEALTH_LABEL = { on_track: 'On track', attention_needed: 'Attention needed', at_risk: 'At risk' } as const
const HEALTH_TONE = { on_track: 'green', attention_needed: 'amber', at_risk: 'red' } as const

export default async function UniversityOverviewPage() {
  const institutionId = universityAdministratorUser.institutionId
  const institution = await mockInstitutionRepository.getInstitution(institutionId)

  const [priorities, departments, facultyCapacity, interventions] = await Promise.all([
    mockUniversityRepository.getPriorities(institutionId),
    mockUniversityRepository.listDepartmentSummaries(institutionId),
    mockUniversityRepository.getFacultyCapacity(institutionId),
    mockUniversityRepository.listInterventions(institutionId),
  ])
  const activeInterventions = interventions.filter((i) => i.status === 'active' || i.status === 'planned' || i.status === 'awaiting_evaluation')

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <PageHeader
        title={institution?.name ?? 'Institution'}
        subtitle="Institution-wide administration — programme architecture, Evidence governance, Faculty capacity, and Capability strategy across every department."
      />

      <section aria-labelledby="priorities-heading">
        <h2 id="priorities-heading" className="mb-1 font-campus-sans text-campus-lg font-medium text-campus-text">
          What needs institutional attention
        </h2>
        <p className="mb-3 font-campus-sans text-campus-sm text-campus-muted">Interpretable institutional issues, ordered by urgency — not a metric dashboard.</p>
        {priorities.length === 0 ? (
          <EmptyState title="Nothing urgent" description="No outstanding institutional priorities identified from current department, Evidence, or governance state." />
        ) : (
          <Card className="p-5">
            <ul className="flex flex-col">
              {priorities.map((p) => (
                <PriorityRow key={p.id} priority={p} />
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section aria-labelledby="departments-heading">
        <h2 id="departments-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Department health
        </h2>
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
                  <Badge tone="neutral">{d.observedCapabilityCoveragePercent}% observed coverage</Badge>
                  <Badge tone={d.reviewCapacityConstrained ? 'amber' : 'green'}>{d.reviewCapacityConstrained ? 'Review capacity constrained' : 'Review capacity healthy'}</Badge>
                  <Badge tone={d.passportReadinessBlockerCount > 0 ? 'blue' : 'neutral'}>{d.passportReadinessBlockerCount} Passport blocker(s)</Badge>
                  <Badge tone={d.odysseyBlockerCount > 0 ? 'blue' : 'neutral'}>{d.odysseyBlockerCount} Odyssey blocker(s)</Badge>
                  {d.activeInterventionCount > 0 && <Badge tone="purple">{d.activeInterventionCount} active intervention(s)</Badge>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="faculty-heading">
        <h2 id="faculty-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Faculty capacity
        </h2>
        <Card className="flex flex-wrap items-center justify-between gap-2 p-4">
          <p className="font-campus-sans text-campus-sm text-campus-text">
            {facultyCapacity.totalFacultyCount} Faculty · {facultyCapacity.totalPendingReviews} pending reviews · {facultyCapacity.totalOverdueReviews} overdue · {facultyCapacity.averageTurnaroundDays}d
            average turnaround
          </p>
          {facultyCapacity.departmentsConstrained.length > 0 && <Badge tone="amber">{facultyCapacity.departmentsConstrained.join(', ')} constrained</Badge>}
        </Card>
        <Link href="/university/faculty" className="mt-2 inline-block font-campus-sans text-campus-sm font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
          View full Faculty capacity →
        </Link>
      </section>

      <section aria-labelledby="interventions-heading">
        <h2 id="interventions-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Current institutional interventions
        </h2>
        {activeInterventions.length === 0 ? (
          <EmptyState title="No active interventions" description="Institutional interventions can be created from Analytics." />
        ) : (
          <div className="flex flex-col gap-2">
            {activeInterventions.map((i) => (
              <Card key={i.id} className="flex flex-col gap-1 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{i.title}</p>
                  <Badge tone="neutral">{i.status.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="font-campus-sans text-campus-xs text-campus-muted">{i.rationale}</p>
              </Card>
            ))}
          </div>
        )}
        <Link href="/university/analytics" className="mt-2 inline-block font-campus-sans text-campus-sm font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
          Manage interventions →
        </Link>
      </section>
    </div>
  )
}
