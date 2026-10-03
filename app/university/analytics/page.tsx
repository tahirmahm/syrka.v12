import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { DistributionBars } from '@/components/department/DistributionBars'
import { InterventionForm } from '@/components/university/InterventionForm'
import { mockUniversityRepository } from '@/lib/repositories'
import { department, programme, capabilityDefinitions, universityAdministratorUser } from '@/lib/mock-data/seed'
import { cohorts } from '@/lib/mock-data/department-seed'
import { INSTITUTIONAL_INTERVENTION_STATUS_LABELS, INSTITUTIONAL_INTERVENTION_STATUS_TONES, INSTITUTIONAL_INTERVENTION_TYPE_LABELS } from '@/lib/constants/university'

export const metadata = { title: 'Institutional Analytics — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function UniversityAnalyticsPage() {
  const institutionId = universityAdministratorUser.institutionId
  const [analytics, interventions] = await Promise.all([mockUniversityRepository.getAnalytics(institutionId), mockUniversityRepository.listInterventions(institutionId)])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Institutional Analytics"
        subtitle="Deeper analysis across departments, programmes, cohorts, and Capability domains — every visualization paired with a textual summary, table, scope, and source explanation."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/university' }, { label: 'Analytics' }]} />}
      />

      <Card className="p-4">
        <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Source and scope</p>
        <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">{analytics.generatedFrom}</p>
      </Card>

      <section aria-labelledby="turnaround-heading">
        <h2 id="turnaround-heading" className="mb-1 font-campus-sans text-campus-lg font-medium text-campus-text">
          Review turnaround trend
        </h2>
        <p className="mb-3 font-campus-sans text-campus-sm text-campus-muted">Average days from Evidence submission to Faculty decision, institution-wide, by month decisions were made.</p>
        {analytics.reviewTurnaroundTrend.length === 0 ? (
          <EmptyState title="No decided reviews yet" />
        ) : (
          <Card className="p-5">
            <table className="w-full font-campus-sans text-campus-sm">
              <thead>
                <tr className="border-b border-campus-border text-left">
                  <th scope="col" className="py-1.5 font-medium text-campus-muted">
                    Month
                  </th>
                  <th scope="col" className="py-1.5 font-medium text-campus-muted">
                    Average turnaround
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.reviewTurnaroundTrend.map((row) => (
                  <tr key={row.periodLabel} className="border-b border-campus-border last:border-b-0">
                    <td className="py-1.5 text-campus-text">{row.periodLabel}</td>
                    <td className="py-1.5 text-campus-muted">{row.averageDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section aria-labelledby="evidence-status-heading">
        <h2 id="evidence-status-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Evidence status
        </h2>
        <Card className="p-5">
          <DistributionBars data={analytics.evidenceStatusDistribution} />
        </Card>
      </section>

      <section aria-labelledby="maturity-heading">
        <h2 id="maturity-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Capability maturity
        </h2>
        <Card className="p-5">
          <DistributionBars data={analytics.maturityDistribution} />
        </Card>
      </section>

      <section aria-labelledby="confidence-heading">
        <h2 id="confidence-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Confidence bands
        </h2>
        <Card className="p-5">
          <DistributionBars data={analytics.confidenceBandDistribution} />
        </Card>
      </section>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Departments</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{analytics.departmentCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Programmes</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{analytics.programmeCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Curriculum alignment issues</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{analytics.curriculumAlignmentIssueCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Passport / Odyssey blockers</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">
            {analytics.passportReadinessBlockerCount} / {analytics.odysseyBlockerCount}
          </p>
        </div>
      </div>

      <section aria-labelledby="interventions-heading" className="flex flex-col gap-4">
        <div>
          <h2 id="interventions-heading" className="mb-1 font-campus-sans text-campus-lg font-medium text-campus-text">
            Institutional interventions
          </h2>
          <p className="font-campus-sans text-campus-sm text-campus-muted">
            Creating an intervention records a planned institutional response — it never itself changes any Capability, Evidence, or Passport outcome. Session-only demo state.
          </p>
        </div>

        {interventions.length === 0 ? (
          <EmptyState title="No interventions yet" />
        ) : (
          <div className="flex flex-col gap-2">
            {interventions.map((i) => (
              <Card key={i.id} className="flex flex-col gap-1.5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{i.title}</p>
                  <Badge tone={INSTITUTIONAL_INTERVENTION_STATUS_TONES[i.status]}>{INSTITUTIONAL_INTERVENTION_STATUS_LABELS[i.status]}</Badge>
                </div>
                <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">{INSTITUTIONAL_INTERVENTION_TYPE_LABELS[i.type]}</p>
                <p className="font-campus-sans text-campus-sm text-campus-muted">{i.rationale}</p>
                <p className="font-campus-sans text-campus-xs text-campus-muted">
                  Projected effect: {i.expectedEffect} · Owner: {i.ownerName} · Review by {new Date(i.reviewDate).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}

        <InterventionForm
          departments={[{ id: department.id, name: department.name }]}
          programmes={[{ id: programme.id, name: programme.name }]}
          cohorts={cohorts.map((c) => ({ id: c.id, name: c.name }))}
          capabilities={capabilityDefinitions.map((c) => ({ id: c.id, name: c.name }))}
        />
      </section>
    </div>
  )
}
