import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { OdysseyMilestoneRow } from '@/components/odyssey/OdysseyMilestoneRow'
import { OdysseyReasoningPanel } from '@/components/odyssey/OdysseyReasoningPanel'
import { mockOdysseyRepository, mockCapabilityRepository, mockPassportRepository } from '@/lib/repositories'
import { currentUser } from '@/lib/mock-data/seed'
import { getActiveMilestone } from '@/lib/utilities/odyssey'
import { MILESTONE_STATUS_LABELS, MILESTONE_STATUS_TONES } from '@/lib/constants/odyssey'

export const metadata = { title: 'Odyssey — Syrka Campus' }

export default async function StudentOdysseyPage() {
  const [odyssey, definitions, passport] = await Promise.all([
    mockOdysseyRepository.getPlanForStudent(currentUser.id),
    mockCapabilityRepository.listDefinitions(),
    mockPassportRepository.getForStudent(currentUser.id),
  ])

  if (!odyssey) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <PageHeader title="Odyssey" breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Odyssey' }]} />} />
        <EmptyState title="No Odyssey plan yet" description="A progression plan is generated once enough capability evidence has been observed." />
      </div>
    )
  }

  const capabilityById = new Map(definitions.map((d) => [d.id, d]))
  const activeMilestone = getActiveMilestone(odyssey.milestones)
  const orderedMilestones = [...odyssey.milestones].sort((a, b) => a.order - b.order)
  const blockedMilestones = odyssey.milestones.filter((m) => m.status === 'blocked')
  const topRecommendation = odyssey.recommendations[0]
  const latestPassportVersion = passport?.versions.find((v) => v.version === passport.currentVersion)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Odyssey"
        subtitle={odyssey.currentStage}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboard', href: '/student' }, { label: 'Odyssey' }]} />}
      />

      {/* Where am I trying to go */}
      <Panel className="flex flex-col gap-2">
        <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Target outcome</p>
        <h2 className="font-campus-sans text-campus-2xl font-semibold text-campus-text">{odyssey.targetOutcome}</h2>
        <p className="font-campus-sans text-campus-sm text-campus-text">{odyssey.intentSummary}</p>
        <p className="mt-1 font-campus-sans text-campus-sm text-campus-muted">{odyssey.currentPositionSummary}</p>
      </Panel>

      {/* What to do next */}
      {activeMilestone && (
        <Panel className="flex flex-col gap-2 border-campus-blue-600 dark:border-campus-blue-dark">
          <div className="flex items-center justify-between">
            <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">What to do next</p>
            <Badge tone={MILESTONE_STATUS_TONES[activeMilestone.status]}>{MILESTONE_STATUS_LABELS[activeMilestone.status]}</Badge>
          </div>
          <p className="font-campus-sans text-campus-base font-medium text-campus-text">{activeMilestone.title}</p>
          {activeMilestone.recommendedAction && <p className="font-campus-sans text-campus-sm text-campus-text">{activeMilestone.recommendedAction}</p>}
        </Panel>
      )}

      {blockedMilestones.length > 0 && (
        <Panel className="flex flex-col gap-2">
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Currently blocked</p>
          {blockedMilestones.map((m) => (
            <p key={m.id} className="font-campus-sans text-campus-sm text-campus-text">
              <span className="font-medium">{m.title}</span> — {m.blockedReason}
            </p>
          ))}
        </Panel>
      )}

      {/* Milestone sequence — structured text, not a visual-only timeline */}
      <section aria-labelledby="milestones-heading">
        <h2 id="milestones-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Milestone sequence
        </h2>
        <ol className="flex flex-col gap-3">
          {orderedMilestones.map((milestone) => (
            <OdysseyMilestoneRow key={milestone.id} milestone={milestone} capabilityById={capabilityById} />
          ))}
        </ol>
      </section>

      {/* Why this path */}
      <OdysseyReasoningPanel
        factors={odyssey.reasoningFactors}
        alternatives={odyssey.alternatives}
        uncertaintyNote={topRecommendation?.uncertaintyNote}
      />

      {/* Connection to Academic Passport */}
      <section aria-labelledby="passport-connection-heading">
        <h2 id="passport-connection-heading" className="mb-3 font-campus-sans text-campus-lg font-medium text-campus-text">
          Effect on your Academic Passport
        </h2>
        <Panel className="flex items-center justify-between gap-4">
          <p className="font-campus-sans text-campus-sm text-campus-text">
            {latestPassportVersion
              ? `${latestPassportVersion.claims.length} capability ${latestPassportVersion.claims.length === 1 ? 'claim is' : 'claims are'} currently shareable. Completing the milestones above would add or strengthen claims as capabilities cross the confidence threshold.`
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
