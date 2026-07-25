import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { OdysseyWorkspace } from '@/components/odyssey/OdysseyWorkspace'
import { OdysseyReasoningPanel } from '@/components/odyssey/OdysseyReasoningPanel'
import { mockOdysseyRepository, mockCapabilityRepository, mockPassportRepository } from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'
import { getActiveMilestone } from '@/lib/utilities/odyssey'
import { orderMilestonesForDisplay, resolveMilestones } from '@/lib/utilities/odyssey-detail'
import { buildOdysseyRoadmap } from '@/lib/utilities/odyssey-projection'

export const metadata = { title: 'Odyssey — Syrka Campus' }
// This page reads from the in-memory Odyssey plan-version store, which
// generate/replan mutate — it must never be statically cached.
export const dynamic = 'force-dynamic'

export default async function StudentOdysseyPage() {
  const [destination, currentPlanVersion, definitions, passport, allVersions] = await Promise.all([
    mockOdysseyRepository.getDestination(currentUser.id),
    mockOdysseyRepository.getCurrentPlanVersion(currentUser.id),
    mockCapabilityRepository.listDefinitions(),
    mockPassportRepository.getForStudent(currentUser.id),
    mockOdysseyRepository.listPlanVersions(currentUser.id),
  ])

  const capabilityById = new Map(definitions.map((d) => [d.id, d]))
  const latestPassportVersion = passport?.versions.find((v) => v.version === passport.currentVersion)

  const milestoneTitlesByVersion: Record<string, Record<string, string>> = {}
  await Promise.all(
    allVersions.map(async (version) => {
      const versionMilestones = await mockOdysseyRepository.getMilestonesForVersion(currentUser.id, version.id)
      milestoneTitlesByVersion[version.id] = Object.fromEntries(versionMilestones.map((m) => [m.id, m.title]))
    })
  )

  if (!destination || !currentPlanVersion) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <PageHeader title="Odyssey" breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Odyssey' }]} />} />
        <EmptyState title="No Odyssey plan yet" description="Generate an Odyssey plan to get an evidence-backed roadmap toward a destination you choose." />
      </div>
    )
  }

  const milestones = await mockOdysseyRepository.getMilestonesForVersion(currentUser.id, currentPlanVersion.id)
  const milestoneIds = milestones.map((m) => m.id)

  const [actions, evidenceRequirements, expectedImpacts, recommendationFactors, alternatives, blockers] = await Promise.all([
    mockOdysseyRepository.getActionsByIds(currentUser.id, milestones.flatMap((m) => m.actionIds)),
    mockOdysseyRepository.getEvidenceRequirementsByIds(currentUser.id, milestones.flatMap((m) => m.evidenceRequirementIds)),
    mockOdysseyRepository.getExpectedImpactsByIds(currentUser.id, milestones.flatMap((m) => m.expectedImpactIds)),
    mockOdysseyRepository.listRecommendationFactors(currentUser.id),
    mockOdysseyRepository.getAlternativeActionsForMilestones(currentUser.id, milestoneIds),
    mockOdysseyRepository.getBlockersForMilestones(currentUser.id, milestoneIds),
  ])

  const milestoneById = new Map(milestones.map((m) => [m.id, m]))
  const alternativesByMilestoneId = new Map<string, typeof alternatives>()
  alternatives.forEach((a) => alternativesByMilestoneId.set(a.milestoneId, [...(alternativesByMilestoneId.get(a.milestoneId) ?? []), a]))
  const blockersByMilestoneId = new Map<string, typeof blockers>()
  blockers.forEach((b) => blockersByMilestoneId.set(b.milestoneId, [...(blockersByMilestoneId.get(b.milestoneId) ?? []), b]))

  const orderedMilestones = orderMilestonesForDisplay(milestones)
  const orderedResolved = resolveMilestones(orderedMilestones, {
    capabilityById,
    actionById: new Map(actions.map((a) => [a.id, a])),
    evidenceRequirementById: new Map(evidenceRequirements.map((r) => [r.id, r])),
    expectedImpactById: new Map(expectedImpacts.map((i) => [i.id, i])),
    alternativesByMilestoneId,
    blockersByMilestoneId,
  })

  const recommendedNext = getActiveMilestone(milestones)
  const { nodes, edges } = buildOdysseyRoadmap(milestones, destination, alternatives, blockers)
  const alternativesWithTitles = alternatives.map((a) => ({ ...a, milestoneTitle: milestoneById.get(a.milestoneId)?.title ?? a.milestoneId }))

  const headerSummary = (
    <div className="max-w-2xl">
      <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Destination</p>
      <h2 className="font-campus-sans text-campus-xl font-semibold text-campus-text">{destination.title}</h2>
      <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">{currentPlanVersion.title} — {currentPlanVersion.reasoningSummary}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral">Version {currentPlanVersion.version}</Badge>
        <Badge tone="blue">Recommendation confidence: {currentPlanVersion.recommendationConfidence}</Badge>
        {currentPlanVersion.providerStatus === 'ai_generated' && <Badge tone="green">AI-generated Odyssey</Badge>}
        {currentPlanVersion.providerStatus === 'fallback_typed' && <Badge tone="amber">Demonstration fallback plan</Badge>}
        {currentPlanVersion.providerStatus === 'previous_preserved' && <Badge tone="neutral">Previous plan retained</Badge>}
      </div>
    </div>
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader title="Odyssey" breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Odyssey' }]} />} />

      <OdysseyWorkspace
        headerSummary={headerSummary}
        hasCurrentPlan
        destinationTitle={destination.title}
        nodes={nodes}
        edges={edges}
        orderedResolved={orderedResolved}
        recommendedNextId={recommendedNext?.id}
        versions={allVersions}
        milestoneTitlesByVersion={milestoneTitlesByVersion}
      />

      <OdysseyReasoningPanel planSummary={currentPlanVersion.reasoningSummary} factors={recommendationFactors} alternatives={alternativesWithTitles} />

      <section aria-labelledby="passport-connection-heading">
        <h2 id="passport-connection-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Effect on your Academic Passport
        </h2>
        <Panel className="flex items-center justify-between gap-4">
          <p className="font-campus-sans text-campus-sm text-campus-text">
            {latestPassportVersion
              ? `${latestPassportVersion.claims.length} capability ${latestPassportVersion.claims.length === 1 ? 'claim is' : 'claims are'} currently shareable. Completing the milestones above would add or strengthen claims as capabilities cross the confidence threshold, once reviewed.`
              : 'No Passport has been issued yet.'}
          </p>
          <Link href="/student/passport" className="flex shrink-0 items-center gap-1 font-campus-sans text-campus-sm text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
            View Passport <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </Panel>
      </section>
    </div>
  )
}
