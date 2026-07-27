import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { DistributionBars } from '@/components/department/DistributionBars'
import { mockUniversityRepository } from '@/lib/repositories'
import { universityAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Institutional Capability Intelligence — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function UniversityCapabilitiesPage() {
  const institutionId = universityAdministratorUser.institutionId
  const [strategy, layers] = await Promise.all([mockUniversityRepository.getCapabilityStrategy(institutionId), mockUniversityRepository.getCapabilityArchitectureLayers()])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Institutional Capability Intelligence"
        subtitle="Confidence, maturity, Evidence volume, and verification state are kept as separate concepts — never one institutional Capability score."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/university' }, { label: 'Capabilities' }]} />}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Capability domains</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{strategy.domainCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Evidence gaps</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{strategy.gapCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Stale claims</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{strategy.staleClaimCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Revoked claims</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{strategy.revokedClaimCount}</p>
        </div>
      </div>

      <section aria-labelledby="architecture-heading">
        <h2 id="architecture-heading" className="mb-1 font-campus-sans text-campus-lg font-medium text-campus-text">
          Institutional Capability architecture
        </h2>
        <p className="mb-3 font-campus-sans text-campus-sm text-campus-muted">
          How Capability development connects from institutional strategy through to the Syrka Career Passport — a layered table, since a graph would add visual complexity without adding
          understanding here.
        </p>
        <div className="overflow-x-auto rounded-campus-md border border-campus-border">
          <table className="w-full min-w-[560px] border-collapse font-campus-sans text-campus-sm">
            <thead>
              <tr className="border-b border-campus-border bg-campus-surface-raised text-left">
                <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
                  Layer
                </th>
                <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
                  What it represents
                </th>
                <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {layers.map((layer) => (
                <tr key={layer.id} className="border-b border-campus-border last:border-b-0">
                  <td className="px-3 py-2 font-medium text-campus-text">{layer.title}</td>
                  <td className="px-3 py-2 text-campus-muted">{layer.description}</td>
                  <td className="px-3 py-2 text-campus-muted">{layer.exampleCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="maturity-heading">
        <h2 id="maturity-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Maturity distribution
        </h2>
        <Card className="p-5">
          <DistributionBars data={strategy.maturityDistribution} />
        </Card>
      </section>

      <section aria-labelledby="confidence-heading">
        <h2 id="confidence-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Confidence-band distribution
        </h2>
        <Card className="p-5">
          <DistributionBars data={strategy.confidenceBandDistribution} />
        </Card>
      </section>

      <section aria-labelledby="coverage-heading">
        <h2 id="coverage-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Department and programme coverage
        </h2>
        <div className="flex flex-col gap-2">
          {strategy.departmentCoverage.map((d) => (
            <Card key={d.departmentId} className="flex items-center justify-between p-4">
              <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{d.departmentName}</p>
              <Badge tone="neutral">{d.capabilitiesCovered} Capabilities with Evidence</Badge>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="investment-heading">
        <h2 id="investment-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Areas requiring investment
        </h2>
        {strategy.investmentAreas.length === 0 ? (
          <EmptyState title="No areas flagged" />
        ) : (
          <ul className="flex flex-col gap-2">
            {strategy.investmentAreas.map((area) => (
              <li key={area} className="rounded-campus-md border border-campus-border p-3 font-campus-sans text-campus-sm text-campus-text">
                {area}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="strong-heading">
        <h2 id="strong-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Areas with strong institutional support
        </h2>
        {strategy.strongSupportAreas.length === 0 ? (
          <EmptyState title="None yet" />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {strategy.strongSupportAreas.map((area) => (
              <Badge key={area} tone="green">
                {area}
              </Badge>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
