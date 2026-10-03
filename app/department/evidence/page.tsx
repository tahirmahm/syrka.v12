import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DistributionBars } from '@/components/department/DistributionBars'
import { mockDepartmentRepository } from '@/lib/repositories'
import { departmentAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Evidence Intelligence — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function DepartmentEvidencePage() {
  const departmentId = departmentAdministratorUser.administratorScope!.departmentId!
  const health = await mockDepartmentRepository.getEvidenceHealth(departmentId)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Evidence Intelligence"
        subtitle="Department-level Evidence health and governance — not a second Faculty review queue."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/department' }, { label: 'Evidence' }]} />}
      />

      <Card className="border-campus-blue-600/30 bg-campus-blue-600/5 p-4 dark:border-campus-blue-dark/30">
        <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-blue-600 dark:text-campus-blue-dark">Department authority boundary</p>
        <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">
          Department Administration can inspect Evidence health, identify review bottlenecks and inconsistent practices, reassign review responsibility, and open a departmental
          intervention or governance concern here. It cannot assign Capability confidence or maturity, create verified Passport claims, alter Odyssey recommendations, fabricate
          provenance, approve Evidence to improve statistics, or bypass required academic review — those remain the assigned Faculty reviewer&apos;s decision.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Disputed</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{health.disputedCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Revoked</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{health.revokedCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Superseded</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{health.supersededCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Provenance concerns</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{health.provenanceConcernCount}</p>
        </div>
      </div>

      <section aria-labelledby="status-heading">
        <h2 id="status-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Status distribution
        </h2>
        <Card className="p-5">
          <DistributionBars data={health.statusDistribution} />
        </Card>
      </section>

      <section aria-labelledby="type-heading">
        <h2 id="type-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Evidence type distribution
        </h2>
        <Card className="p-5">
          <DistributionBars data={health.typeDistribution} />
        </Card>
      </section>

      <section aria-labelledby="ageing-heading">
        <h2 id="ageing-heading" className="mb-1 font-campus-sans text-campus-lg font-medium text-campus-text">
          Review ageing
        </h2>
        <p className="mb-3 font-campus-sans text-campus-sm text-campus-muted">How long pending Evidence has been waiting for review, bucketed by age.</p>
        <Card className="p-5">
          <DistributionBars data={Object.fromEntries(health.reviewAgeingBuckets.map((b) => [b.bucketLabel, b.count]))} />
        </Card>
      </section>

      <section aria-labelledby="sources-heading">
        <h2 id="sources-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Evidence by course source
        </h2>
        <div className="flex flex-col gap-2">
          {health.courseSourceCounts.map((c) => (
            <Link key={c.courseId} href={`/department/courses/${c.courseId}`}>
              <Card interactive className="flex flex-wrap items-center justify-between gap-2 p-4">
                <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{c.courseLabel}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{c.evidenceCount} Evidence records</Badge>
                  {health.strongestSourceCourseIds.includes(c.courseId) && <Badge tone="green">Strong source</Badge>}
                  {health.weakestSourceCourseIds.includes(c.courseId) && <Badge tone="amber">Needs attention</Badge>}
                  {health.reviewBottleneckCourseIds.includes(c.courseId) && <Badge tone="red">Review bottleneck</Badge>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <p className="font-campus-mono text-campus-xs text-campus-muted">Revision rate across recorded Faculty decisions: {Math.round(health.revisionRate * 100)}%.</p>
    </div>
  )
}
