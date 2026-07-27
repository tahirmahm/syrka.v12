import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockUniversityRepository } from '@/lib/repositories'
import { universityAdministratorUser } from '@/lib/mock-data/seed'

export const metadata = { title: 'Institutional Odyssey Intelligence — Syrka Campus' }
export const dynamic = 'force-dynamic'

export default async function UniversityOdysseyPage() {
  const insight = await mockUniversityRepository.getOdysseyAggregateInsight(universityAdministratorUser.institutionId)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Institutional Odyssey Intelligence"
        subtitle="Aggregate and operational only — not a University-controlled student roadmap editor."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/university' }, { label: 'Odyssey' }]} />}
      />

      <Card className="border-campus-blue-600/30 bg-campus-blue-600/5 p-4 dark:border-campus-blue-dark/30">
        <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-blue-600 dark:text-campus-blue-dark">Authority boundary</p>
        <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">
          University Administration may identify systemic blockers, add or improve institutional opportunities, address missing courses or projects, improve review capacity, and
          create interventions. It may not rewrite an individual student&apos;s Odyssey arbitrarily, represent AI recommendations as mandatory, directly mark milestones verified, or
          bypass Evidence requirements.
        </p>
      </Card>

      <section aria-labelledby="destinations-heading">
        <h2 id="destinations-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Active destinations
        </h2>
        {insight.activeDestinationTitles.length === 0 ? (
          <EmptyState title="No active destinations" />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {insight.activeDestinationTitles.map((title) => (
              <Badge key={title} tone="blue">
                {title}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="gaps-heading">
        <h2 id="gaps-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Common Capability gaps behind blocked milestones
        </h2>
        {insight.commonCapabilityGapNames.length === 0 ? (
          <EmptyState title="No blocked milestones" />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {insight.commonCapabilityGapNames.map((name) => (
              <Badge key={name} tone="amber">
                {name}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="blockers-heading">
        <h2 id="blockers-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Common milestone blocker reasons
        </h2>
        {insight.commonMilestoneBlockerReasons.length === 0 ? (
          <EmptyState title="No blockers recorded" />
        ) : (
          <ul className="flex flex-col gap-2">
            {insight.commonMilestoneBlockerReasons.map((reason) => (
              <li key={reason} className="rounded-campus-md border border-campus-border p-3 font-campus-sans text-campus-sm text-campus-text">
                {reason}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="review-gates-heading">
        <h2 id="review-gates-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Review gates causing delay
        </h2>
        {insight.reviewGateDelayNotes.length === 0 ? (
          <EmptyState title="No review-gate delays" />
        ) : (
          <ul className="flex flex-col gap-2">
            {insight.reviewGateDelayNotes.map((note) => (
              <li key={note} className="rounded-campus-md border border-campus-border p-3 font-campus-sans text-campus-sm text-campus-text">
                {note}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="resources-heading">
        <h2 id="resources-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Frequently recommended institutional resources
        </h2>
        {insight.frequentlyRecommendedResourceTitles.length === 0 ? (
          <EmptyState title="No resources recommended yet" />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {insight.frequentlyRecommendedResourceTitles.map((title) => (
              <Badge key={title} tone="neutral">
                {title}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="patterns-heading">
        <h2 id="patterns-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Programme and department patterns
        </h2>
        <div className="flex flex-col gap-2">
          {insight.programmePatterns.map((p) => (
            <Card key={p.programmeId} className="flex items-center justify-between p-4">
              <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{p.programmeName}</p>
              <Badge tone={p.blockedMilestoneCount > 0 ? 'amber' : 'green'}>{p.blockedMilestoneCount} blocked milestone(s)</Badge>
            </Card>
          ))}
        </div>
      </section>

      <p className="font-campus-mono text-campus-xs text-campus-muted">Alternative pathways requested: {insight.alternativePathwaysRequestedCount}</p>
    </div>
  )
}
