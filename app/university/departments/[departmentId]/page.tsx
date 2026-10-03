import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockUniversityRepository } from '@/lib/repositories'

async function loadDepartment(departmentId: string) {
  return mockUniversityRepository.getDepartmentDetail(departmentId)
}

export async function generateMetadata({ params }: { params: { departmentId: string } }) {
  const detail = await loadDepartment(params.departmentId)
  if (!detail) notFound()
  return { title: `${detail.departmentName} — Syrka Campus` }
}

export default async function UniversityDepartmentDetailPage({ params }: { params: { departmentId: string } }) {
  const detail = await loadDepartment(params.departmentId)
  if (!detail) notFound()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title={detail.departmentName}
        subtitle="Institution-level view — how this department compares with institutional expectations, not the department's own dashboard."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/university' }, { label: 'Departments', href: '/university/departments' }, { label: detail.departmentName }]} />}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Observed coverage</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{detail.observedCapabilityCoveragePercent}%</p>
          <p className="mt-1 font-campus-mono text-campus-xs text-campus-muted">vs. {detail.expectedCapabilityCoveragePercent}% institutional expectation</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Passport blockers</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{detail.passportReadinessBlockerCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Odyssey blockers</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{detail.odysseyBlockerCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Active interventions</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{detail.activeInterventionCount}</p>
        </div>
      </div>

      <section aria-labelledby="gaps-heading">
        <h2 id="gaps-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Shared Capability gaps
        </h2>
        {detail.sharedCapabilityGapNames.length === 0 ? (
          <EmptyState title="No Capability gaps flagged" />
        ) : (
          <ul className="flex flex-col gap-2">
            {detail.sharedCapabilityGapNames.map((gap) => (
              <li key={gap} className="rounded-campus-md border border-campus-border p-3 font-campus-sans text-campus-sm text-campus-text">
                {gap}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="cross-dept-heading">
        <h2 id="cross-dept-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Cross-department dependencies
        </h2>
        <ul className="flex flex-col gap-2">
          {detail.crossDepartmentDependencyNotes.map((note) => (
            <li key={note} className="rounded-campus-md border border-dashed border-campus-border p-3 font-campus-sans text-campus-sm text-campus-muted">
              {note}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="support-heading">
        <h2 id="support-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Programmes requiring institutional support
        </h2>
        {detail.programmesRequiringSupport.length === 0 ? (
          <EmptyState title="No programmes flagged" />
        ) : (
          <div className="flex flex-col gap-2">
            {detail.programmesRequiringSupport.map((p) => (
              <Card key={p.programmeId} className="flex items-center justify-between p-4">
                <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{p.programmeName}</p>
                <Badge tone="amber">{p.reason}</Badge>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="interventions-heading">
        <h2 id="interventions-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Institutional interventions affecting this department
        </h2>
        {detail.institutionalInterventionsAffecting.length === 0 ? (
          <EmptyState title="None currently" />
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {detail.institutionalInterventionsAffecting.map((title) => (
              <Badge key={title} tone="purple">
                {title}
              </Badge>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="governance-heading">
        <h2 id="governance-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Governance escalations
        </h2>
        {detail.governanceEscalations.length === 0 ? (
          <EmptyState title="No governance escalations" />
        ) : (
          <ul className="flex flex-col gap-2">
            {detail.governanceEscalations.map((e) => (
              <li key={e} className="rounded-campus-md border border-campus-border p-3 font-campus-sans text-campus-sm text-campus-text">
                {e}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
