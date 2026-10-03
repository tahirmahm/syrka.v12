import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { DistributionBars } from '@/components/department/DistributionBars'
import { mockDepartmentRepository } from '@/lib/repositories'
import { departmentAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Capability Intelligence — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function DepartmentCapabilitiesPage() {
  const departmentId = departmentAdministratorUser.administratorScope!.departmentId!
  const summary = await mockDepartmentRepository.getCapabilityIntelligence(departmentId)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Capability Intelligence"
        subtitle="Aggregate Capability development across this department — maturity and confidence kept separate, never one composite score."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/department' }, { label: 'Capabilities' }]} />}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Capability domains</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{summary.domainCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Evidence gaps</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{summary.gapCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Stale claims</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{summary.staleClaimCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Revoked claims</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{summary.revokedClaimCount}</p>
        </div>
      </div>

      <section aria-labelledby="maturity-heading">
        <h2 id="maturity-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Maturity distribution
        </h2>
        <Card className="p-5">
          <DistributionBars data={summary.maturityDistribution} />
        </Card>
      </section>

      <section aria-labelledby="confidence-heading">
        <h2 id="confidence-heading" className="mb-1 font-campus-sans text-campus-lg font-medium text-campus-text">
          Confidence-band distribution
        </h2>
        <p className="mb-3 font-campus-sans text-campus-sm text-campus-muted">Kept separate from maturity by design — a high-maturity claim can still carry lower calibrated confidence.</p>
        <Card className="p-5">
          <DistributionBars data={summary.confidenceBandDistribution} />
        </Card>
      </section>

      <section aria-labelledby="source-heading">
        <h2 id="source-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Evidence-source diversity
        </h2>
        <Card className="p-5">
          <DistributionBars data={summary.evidenceSourceTypeDiversity} />
        </Card>
      </section>

      <section aria-labelledby="courses-heading">
        <h2 id="courses-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Course contribution
        </h2>
        <div className="flex flex-col gap-2">
          {summary.courseContribution.map((c) => (
            <Link key={c.courseId} href={`/department/courses/${c.courseId}`}>
              <Card interactive className="flex items-center justify-between p-4">
                <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{c.courseLabel}</p>
                <Badge tone="neutral">{c.capabilitiesCovered} Capabilities with Evidence</Badge>
              </Card>
            </Link>
          ))}
        </div>
        <p className="mt-2 font-campus-sans text-campus-xs text-campus-muted">
          This demo dataset models one programme and one cohort, so cohort-to-cohort and programme-to-programme comparisons aren&apos;t yet meaningful — course contribution above is the
          available cross-section.
        </p>
      </section>

      <section aria-labelledby="attention-heading">
        <h2 id="attention-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Recommended areas for curriculum attention
        </h2>
        {summary.recommendedAttentionAreas.length === 0 ? (
          <EmptyState title="No areas flagged" description="No Capability gaps or stale claims currently need curriculum attention." />
        ) : (
          <ul className="flex flex-col gap-2">
            {summary.recommendedAttentionAreas.map((area) => (
              <li key={area} className="rounded-campus-md border border-campus-border p-3 font-campus-sans text-campus-sm text-campus-text">
                {area}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
