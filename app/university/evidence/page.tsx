import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { DistributionBars } from '@/components/department/DistributionBars'
import { mockUniversityRepository } from '@/lib/repositories'
import { universityAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Evidence Governance — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function UniversityEvidencePage() {
  const governance = await mockUniversityRepository.getEvidenceGovernance(universityAdministratorUser.institutionId)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Evidence Governance"
        subtitle="An institutional Evidence governance surface — not a Faculty review queue."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/university' }, { label: 'Evidence' }]} />}
      />

      <Card className="border-campus-blue-600/30 bg-campus-blue-600/5 p-4 dark:border-campus-blue-dark/30">
        <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-blue-600 dark:text-campus-blue-dark">Evidence Governance Authority</p>
        <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">
          University Administration can define and inspect Evidence-governance policy, identify inconsistent review practice, request calibration, commission an audit, assign
          institutional follow-up, inspect provenance and review history, create a governance intervention, and escalate a material concern. It cannot fabricate Evidence, assign
          arbitrary Capability confidence or maturity, create Passport claims without required Evidence, approve Evidence to improve institutional statistics, bypass academic-review
          requirements, or alter Odyssey recommendations directly.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Disputed</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{governance.disputedCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Revoked</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{governance.revokedCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Superseded</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{governance.supersededCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Provenance concerns</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{governance.provenanceConcernCount}</p>
        </div>
      </div>

      <section aria-labelledby="status-heading">
        <h2 id="status-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Status distribution
        </h2>
        <Card className="p-5">
          <DistributionBars data={governance.statusDistribution} />
        </Card>
      </section>

      <section aria-labelledby="type-heading">
        <h2 id="type-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Evidence type distribution
        </h2>
        <Card className="p-5">
          <DistributionBars data={governance.typeDistribution} />
        </Card>
      </section>

      <section aria-labelledby="ageing-heading">
        <h2 id="ageing-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Review ageing
        </h2>
        <Card className="p-5">
          <DistributionBars data={Object.fromEntries(governance.reviewAgeingBuckets.map((b) => [b.bucketLabel, b.count]))} />
        </Card>
      </section>

      <section aria-labelledby="sources-heading">
        <h2 id="sources-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Evidence by department source
        </h2>
        <div className="flex flex-col gap-2">
          {governance.departmentSourceCounts.map((d) => (
            <Card key={d.departmentId} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{d.departmentName}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="neutral">{d.evidenceCount} Evidence records</Badge>
                {governance.reviewBottleneckDepartmentIds.includes(d.departmentId) && <Badge tone="red">Review bottleneck</Badge>}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="patterns-heading">
        <h2 id="patterns-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Governance notes
        </h2>
        {governance.assessmentConcentrationNotes.length === 0 && governance.inconsistentReviewPatternNotes.length === 0 ? (
          <EmptyState title="No governance concerns flagged" />
        ) : (
          <ul className="flex flex-col gap-2">
            {[...governance.assessmentConcentrationNotes, ...governance.inconsistentReviewPatternNotes].map((note) => (
              <li key={note} className="rounded-campus-md border border-campus-border p-3 font-campus-sans text-campus-sm text-campus-text">
                {note}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="font-campus-mono text-campus-xs text-campus-muted">
        Programme Evidence gaps: {governance.programmeGapCount} · Department Evidence gaps: {governance.departmentGapCount} · Revision rate: {Math.round(governance.revisionRate * 100)}%
      </p>
    </div>
  )
}
