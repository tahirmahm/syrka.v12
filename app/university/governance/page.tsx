import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockUniversityRepository } from '@/lib/repositories'
import { GOVERNANCE_AREA_LABELS, GOVERNANCE_STATE_LABELS, GOVERNANCE_STATE_TONES } from '@/lib/constants/university'

export const metadata = { title: 'Governance — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function UniversityGovernancePage() {
  const [policies, proposals] = await Promise.all([mockUniversityRepository.listGovernancePolicies(), mockUniversityRepository.listGovernanceProposals()])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Governance"
        subtitle="Inspectable institutional controls and policy — each clearly labelled as active, proposed, a demo configuration, or requiring backend integration. Non-functional settings are never described as permanently saved."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/university' }, { label: 'Governance' }]} />}
      />

      <section aria-labelledby="policies-heading">
        <h2 id="policies-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Policy areas
        </h2>
        <div className="flex flex-col gap-2">
          {policies.map((policy) => (
            <Card key={policy.id} className="flex flex-col gap-1.5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{policy.title}</p>
                <Badge tone={GOVERNANCE_STATE_TONES[policy.state]}>{GOVERNANCE_STATE_LABELS[policy.state]}</Badge>
              </div>
              <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">{GOVERNANCE_AREA_LABELS[policy.area]}</p>
              <p className="font-campus-sans text-campus-sm text-campus-muted">{policy.description}</p>
              {policy.lastReviewedAt && <p className="font-campus-mono text-campus-xs text-campus-muted">Last reviewed {new Date(policy.lastReviewedAt).toLocaleDateString()}</p>}
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="proposals-heading">
        <h2 id="proposals-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Proposals under review
        </h2>
        {proposals.length === 0 ? (
          <EmptyState title="No open proposals" />
        ) : (
          <div className="flex flex-col gap-2">
            {proposals.map((p) => (
              <Card key={p.id} className="flex flex-col gap-1.5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{p.title}</p>
                  <Badge tone="blue">{p.status.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">{GOVERNANCE_AREA_LABELS[p.area]}</p>
                <p className="font-campus-sans text-campus-sm text-campus-muted">{p.rationale}</p>
                <p className="font-campus-mono text-campus-xs text-campus-muted">
                  Proposed by {p.proposedBy} on {new Date(p.proposedAt).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
