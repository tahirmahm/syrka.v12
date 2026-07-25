import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { Status } from '@/components/ui/Status'
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockCapabilityRepository, mockEvidenceRepository, mockOdysseyRepository } from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'
import { formatDate, formatRelativeTime } from '@/lib/utilities/format-relative-time'

export async function generateMetadata({ params }: { params: { capabilityId: string } }) {
  const definition = await mockCapabilityRepository.getDefinition(params.capabilityId)
  if (!definition) notFound()
  return { title: `${definition.name} — Syrka Campus` }
}

export default async function CapabilityDetailPage({ params }: { params: { capabilityId: string } }) {
  const definition = await mockCapabilityRepository.getDefinition(params.capabilityId)
  if (!definition) notFound()

  const [claim, evidence, relationEdges, odyssey, allDefinitions] = await Promise.all([
    mockCapabilityRepository.getClaimForCapability(currentUser.id, definition.id),
    mockEvidenceRepository.listForCapability(definition.id),
    mockCapabilityRepository.listRelationEdges(),
    mockOdysseyRepository.getPlanForStudent(currentUser.id),
    mockCapabilityRepository.listDefinitions(),
  ])

  const definitionById = new Map(allDefinitions.map((d) => [d.id, d]))
  const prerequisites = relationEdges.filter((e) => e.type === 'REQUIRES' && e.fromCapabilityId === definition.id)
  const dependents = relationEdges.filter((e) => e.toCapabilityId === definition.id)
  const related = relationEdges.filter((e) => e.type === 'DEPENDS_ON' && e.fromCapabilityId === definition.id)

  const verifiedEvidence = evidence.filter((e) => e.review.status === 'verified')
  const strongestEvidence = [...verifiedEvidence].sort((a, b) => new Date(b.record.submittedAt).getTime() - new Date(a.record.submittedAt).getTime())[0]

  const odysseyMilestone = odyssey?.milestones.find((m) => m.requiredCapabilityIds.includes(definition.id))
  const odysseyRecommendation = odyssey?.recommendations.find((r) => r.capabilityId === definition.id)

  const latestAssessment = claim?.history[claim.history.length - 1]

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title={definition.name}
        subtitle={definition.domain}
        breadcrumbs={
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Capabilities', href: '/student/capabilities' }, { label: definition.name }]} />
        }
        actions={claim && <Badge tone="neutral">{claim.maturity}</Badge>}
      />

      <Panel className="flex flex-col gap-4">
        <p className="font-campus-sans text-campus-sm text-campus-text">{definition.description}</p>
        {claim ? (
          <>
            <ConfidenceMeter
              confidence={claim.confidence}
              explanation={latestAssessment ? latestAssessment.cause : undefined}
            />
            <p className="font-campus-mono text-campus-xs text-campus-muted">
              Last observed {formatDate(claim.lastObservedAt)} ({formatRelativeTime(claim.lastObservedAt)})
            </p>
            {claim.maturity === 'Stale' && (
              <p className="font-campus-sans text-campus-sm text-campus-amber-600 dark:text-campus-amber-dark">
                This capability’s confidence has decayed due to time since new evidence. New evidence would refresh it.
              </p>
            )}
            {claim.maturity === 'Revoked' && (
              <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">
                This capability’s only supporting evidence was revoked. It currently has no active support.
              </p>
            )}
          </>
        ) : (
          <p className="font-campus-sans text-campus-sm text-campus-muted">No claim yet — insufficient evidence has been observed for this capability.</p>
        )}
      </Panel>

      {odysseyMilestone && (
        <Panel>
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Odyssey relevance</p>
          <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">
            Required for milestone <span className="font-medium">{odysseyMilestone.title}</span>, toward {odyssey?.targetOutcome}.
          </p>
        </Panel>
      )}
      {odysseyRecommendation && (
        <Panel>
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Recommended next action</p>
          <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">{odysseyRecommendation.title} — {odysseyRecommendation.reason}</p>
        </Panel>
      )}

      <section aria-labelledby="evidence-basis-heading">
        <h2 id="evidence-basis-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Evidence basis
        </h2>
        {evidence.length === 0 ? (
          <EmptyState title="No evidence gap can be closed without evidence" description="Submit coursework or an achievement referencing this capability to begin building a claim." />
        ) : (
          <div className="flex flex-col gap-2">
            {strongestEvidence && (
              <p className="font-campus-sans text-campus-xs text-campus-muted">
                Strongest supporting evidence: <span className="font-medium text-campus-text">{strongestEvidence.record.title}</span>
              </p>
            )}
            {evidence.map((item) => (
              <Link key={item.record.id} href={`/student/evidence/${item.record.id}`}>
                <Panel className="flex items-center justify-between p-4">
                  <p className="font-campus-sans text-campus-sm text-campus-text">{item.record.title}</p>
                  <Status tone={item.review.status} />
                </Panel>
              </Link>
            ))}
            {verifiedEvidence.length === 0 && (
              <p className="font-campus-sans text-campus-xs text-campus-muted">
                Evidence gap: no verified evidence currently supports this capability at a higher confidence.
              </p>
            )}
          </div>
        )}
      </section>

      {(prerequisites.length > 0 || dependents.length > 0 || related.length > 0) && (
        <section aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
            Related capabilities
          </h2>
          <div className="flex flex-col gap-2">
            {prerequisites.map((edge) => {
              const target = definitionById.get(edge.toCapabilityId)
              return target ? (
                <Link key={edge.id} href={`/student/capabilities/${target.id}`}>
                  <Panel className="flex items-center justify-between p-4">
                    <p className="font-campus-sans text-campus-sm text-campus-text">Requires {target.name}</p>
                    <Badge tone="blue">Prerequisite</Badge>
                  </Panel>
                </Link>
              ) : null
            })}
            {related.map((edge) => {
              const target = definitionById.get(edge.toCapabilityId)
              return target ? (
                <Link key={edge.id} href={`/student/capabilities/${target.id}`}>
                  <Panel className="flex items-center justify-between p-4">
                    <p className="font-campus-sans text-campus-sm text-campus-text">Related to {target.name}</p>
                    <Badge tone="neutral">Related</Badge>
                  </Panel>
                </Link>
              ) : null
            })}
            {dependents.map((edge) => {
              const source = definitionById.get(edge.fromCapabilityId)
              return source ? (
                <Link key={edge.id} href={`/student/capabilities/${source.id}`}>
                  <Panel className="flex items-center justify-between p-4">
                    <p className="font-campus-sans text-campus-sm text-campus-text">{source.name} {edge.type === 'REQUIRES' ? 'requires this' : 'relates to this'}</p>
                    <Badge tone="neutral">{edge.type === 'REQUIRES' ? 'Dependent' : 'Related'}</Badge>
                  </Panel>
                </Link>
              ) : null
            })}
          </div>
        </section>
      )}
    </div>
  )
}
