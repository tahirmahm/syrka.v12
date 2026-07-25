import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { DistributionBars } from '@/components/department/DistributionBars'
import { mockUniversityRepository } from '@/lib/repositories'
import { universityAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Institutional Passport Intelligence — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function UniversityPassportsPage() {
  const institutionId = universityAdministratorUser.institutionId
  const [readiness, stages] = await Promise.all([mockUniversityRepository.getPassportReadinessAggregate(institutionId), mockUniversityRepository.getPassportIssuanceStages(institutionId)])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Institutional Passport Intelligence"
        subtitle="Institutional Passport readiness and governance — never one universal Passport score, and no implied cryptographic verification beyond what's actually implemented."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/university' }, { label: 'Passports' }]} />}
      />

      <section aria-labelledby="boundary-heading">
        <h2 id="boundary-heading" className="mb-1 font-campus-sans text-campus-lg font-medium text-campus-text">
          Passport issuance boundary
        </h2>
        <p className="mb-3 font-campus-sans text-campus-sm text-campus-muted">
          Evidence reviewed, a Capability claim supported, Passport-eligible, a version prepared, issued, and later updated/stale/revoked are kept as distinct stages — never collapsed
          into one status.
        </p>
        <div className="overflow-x-auto rounded-campus-md border border-campus-border">
          <table className="w-full min-w-[480px] border-collapse font-campus-sans text-campus-sm">
            <thead>
              <tr className="border-b border-campus-border bg-campus-surface-raised text-left">
                <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
                  Stage
                </th>
                <th scope="col" className="px-3 py-2 font-medium text-campus-muted">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {stages.map((s) => (
                <tr key={s.stage} className="border-b border-campus-border last:border-b-0">
                  <td className="px-3 py-2 text-campus-text">{s.label}</td>
                  <td className="px-3 py-2 text-campus-muted">{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Ready claims</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{readiness.readyClaimCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Withheld claims</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{readiness.withheldClaimCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Stale claims</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{readiness.staleClaimCount}</p>
        </div>
        <div className="rounded-campus-md border border-campus-border p-4">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Revoked claims</p>
          <p className="mt-1 font-campus-sans text-campus-2xl font-semibold text-campus-text">{readiness.revokedClaimCount}</p>
        </div>
      </div>

      <section aria-labelledby="verification-heading">
        <h2 id="verification-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Verification-state distribution
        </h2>
        <Card className="p-5">
          <DistributionBars data={readiness.verificationStateDistribution} />
        </Card>
      </section>

      <section aria-labelledby="blockers-heading">
        <h2 id="blockers-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Common readiness blockers
        </h2>
        {readiness.commonReadinessBlockerReasons.length === 0 ? (
          <EmptyState title="No blockers" />
        ) : (
          <ul className="flex flex-col gap-2">
            {readiness.commonReadinessBlockerReasons.map((reason) => (
              <li key={reason} className="rounded-campus-md border border-campus-border p-3 font-campus-sans text-campus-sm text-campus-text">
                {reason}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="readiness-heading">
        <h2 id="readiness-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Programme and department readiness
        </h2>
        <div className="flex flex-col gap-2">
          {readiness.programmeReadiness.map((p) => (
            <Card key={p.programmeId} className="flex items-center justify-between p-4">
              <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{p.programmeName}</p>
              <div className="flex gap-1.5">
                <Badge tone="green">{p.readyClaimCount} ready</Badge>
                <Badge tone="neutral">{p.withheldClaimCount} withheld</Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="reissue-heading">
        <h2 id="reissue-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Versioning and reissue history
        </h2>
        {readiness.reissuePatternNotes.length === 0 ? (
          <EmptyState title="No reissues recorded" />
        ) : (
          <ul className="flex flex-col gap-2">
            {readiness.reissuePatternNotes.map((note) => (
              <li key={note} className="rounded-campus-md border border-campus-border p-3 font-campus-sans text-campus-sm text-campus-text">
                {note}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
