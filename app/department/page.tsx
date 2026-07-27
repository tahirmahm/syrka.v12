import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PriorityRow } from '@/components/department/PriorityRow'
import { mockInstitutionRepository, mockDepartmentRepository } from '@/lib/repositories'
import { departmentAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Department — Syrka Campus' }
export const dynamic = 'force-dynamic'

const REVIEW_HEALTH_LABEL = { on_track: 'On track', attention_needed: 'Attention needed', at_risk: 'At risk' } as const
const REVIEW_HEALTH_TONE = { on_track: 'green', attention_needed: 'amber', at_risk: 'red' } as const

export default async function DepartmentOverviewPage() {
  const departmentId = departmentAdministratorUser.administratorScope?.departmentId
  const department = departmentId ? await mockInstitutionRepository.getDepartment(departmentId) : undefined
  if (!departmentId || !department) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <PageHeader title="Department" />
        <EmptyState title="No department scope configured" description="This demo user has no department assigned." />
      </div>
    )
  }

  const [priorities, programmeHealth, facultyCoordination, interventions] = await Promise.all([
    mockDepartmentRepository.getPriorities(departmentId),
    mockDepartmentRepository.listProgrammeHealth(departmentId),
    mockDepartmentRepository.listFacultyCoordination(departmentId),
    mockDepartmentRepository.listInterventions(departmentId),
  ])

  const activeInterventions = interventions.filter((i) => i.status === 'active' || i.status === 'planned' || i.status === 'awaiting_evaluation')

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <PageHeader
        title={department.name}
        subtitle="University Administration scoped to this department — programme intent, Evidence, Capability development, and Faculty coordination in one operational view."
      />

      <section aria-labelledby="priorities-heading">
        <h2 id="priorities-heading" className="mb-1 font-campus-sans text-campus-lg font-medium text-campus-text">
          What needs attention
        </h2>
        <p className="mb-3 font-campus-sans text-campus-sm text-campus-muted">Interpretable operational problems, ordered by urgency — not a metric dashboard.</p>
        {priorities.length === 0 ? (
          <EmptyState title="Nothing urgent" description="No outstanding priorities identified from current programme, Evidence, or Capability state." />
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

      <section aria-labelledby="programmes-heading">
        <h2 id="programmes-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Programme health
        </h2>
        <div className="flex flex-col gap-2">
          {programmeHealth.map((p) => (
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
                  <Badge tone="neutral">{p.observedCapabilityCoveragePercent}% observed coverage</Badge>
                  <Badge tone="neutral">
                    {p.evidenceProducingCourseCount}/{p.totalCourseCount} courses producing Evidence
                  </Badge>
                  <Badge tone={p.unresolvedEvidenceCount > 0 ? 'blue' : 'neutral'}>{p.unresolvedEvidenceCount} unresolved Evidence</Badge>
                  <Badge tone={p.gapCount > 0 ? 'amber' : 'green'}>{p.gapCount > 0 ? `${p.gapCount} curriculum gap${p.gapCount === 1 ? '' : 's'}` : 'No curriculum gaps'}</Badge>
                  {p.activeInterventionCount > 0 && <Badge tone="purple">{p.activeInterventionCount} active intervention{p.activeInterventionCount === 1 ? '' : 's'}</Badge>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="faculty-heading">
        <h2 id="faculty-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Faculty support
        </h2>
        <div className="flex flex-col gap-2">
          {facultyCoordination.map((f) => (
            <Card key={f.facultyId} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{f.facultyName}</p>
                <p className="font-campus-mono text-campus-xs text-campus-muted">
                  {f.pendingReviewCount} pending · {f.overdueReviewCount} overdue · {f.reviewCompletionPercent}% review completion
                </p>
              </div>
              <Badge tone={f.supportStatus === 'support_recommended' ? 'red' : f.supportStatus === 'monitor' ? 'amber' : 'green'}>{f.supportStatus.replace(/_/g, ' ')}</Badge>
            </Card>
          ))}
        </div>
        <Link href="/department/faculty" className="mt-2 inline-block font-campus-sans text-campus-sm font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
          View full Faculty coordination →
        </Link>
      </section>

      <section aria-labelledby="interventions-heading">
        <h2 id="interventions-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Current departmental interventions
        </h2>
        {activeInterventions.length === 0 ? (
          <EmptyState title="No active interventions" description="Interventions can be created from Programmes, Courses, or the Analytics workflow." />
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
        <Link href="/department/analytics" className="mt-2 inline-block font-campus-sans text-campus-sm font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
          Manage interventions →
        </Link>
      </section>
    </div>
  )
}
