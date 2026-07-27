import Link from 'next/link'
import { ArrowRight, Compass, BookOpen, IdentificationCard, Warning } from '@phosphor-icons/react/dist/ssr'
import { Badge } from '@/components/ui/Badge'
import { Status } from '@/components/ui/Status'
import { SyrkaIntelligenceState } from '@/components/intelligence/SyrkaIntelligenceState'
import {
  mockCapabilityRepository,
  mockEvidenceRepository,
  mockOdysseyRepository,
  mockPassportRepository,
  mockInstitutionRepository,
} from '@/lib/repositories'
import { getActiveMilestone } from '@/lib/utilities/odyssey'
import { buildStudentLearningProjection } from '@/lib/utilities/learning-projection'
import { currentUser } from '@/lib/mock-data/seed'
import { PASSPORT_DISPLAY_NAME } from '@/lib/constants/passport'
import type { CapabilityClaim, CapabilityDefinition, OdysseyMilestone } from '@/lib/campus-types'

export const metadata = { title: 'Home — Syrka Campus' }
// Reflects the in-memory Odyssey plan-version store, which generate/replan mutate.
export const dynamic = 'force-dynamic'

const MATURITY_BAND: Record<string, { label: string; order: number }> = {
  Expert: { label: 'Independently demonstrated', order: 0 },
  Advanced: { label: 'Independently demonstrated', order: 0 },
  Proficient: { label: 'Developing', order: 1 },
  Developing: { label: 'Developing', order: 1 },
  Emerging: { label: 'Early / guided', order: 2 },
  Exposed: { label: 'Early / guided', order: 2 },
  Stale: { label: 'Needs refresh', order: 3 },
  Revoked: { label: 'Revoked', order: 4 },
}

export default async function StudentDashboardPage() {
  const [capabilityClaims, capabilityDefinitions, evidence, currentPlanVersion, passport, programme] = await Promise.all([
    mockCapabilityRepository.listClaimsForSubject(currentUser.id),
    mockCapabilityRepository.listDefinitions(),
    mockEvidenceRepository.listForStudent(currentUser.id),
    mockOdysseyRepository.getCurrentPlanVersion(currentUser.id),
    mockPassportRepository.getForStudent(currentUser.id),
    currentUser.programmeId ? mockInstitutionRepository.getProgramme(currentUser.programmeId) : Promise.resolve(undefined),
  ])
  const institution = await mockInstitutionRepository.getInstitution(currentUser.institutionId)
  const [odysseyMilestones, destination] = currentPlanVersion
    ? await Promise.all([
        mockOdysseyRepository.getMilestonesForVersion(currentUser.id, currentPlanVersion.id),
        mockOdysseyRepository.getDestination(currentUser.id),
      ])
    : [[] as OdysseyMilestone[], undefined]

  const learning = buildStudentLearningProjection()
  const currentMilestone = getActiveMilestone(odysseyMilestones)
  const blockedMilestone = odysseyMilestones.find((m) => m.status === 'blocked')
  const recommendedMilestone = odysseyMilestones.find((m) => m.status === 'recommended')
  const disputedEvidence = evidence.filter((e) => e.review.status === 'disputed')
  const pendingEvidence = evidence.filter((e) => e.review.status === 'pending')
  const latestPassportVersion = passport?.versions.find((v) => v.version === passport.currentVersion)
  const withheldCount = latestPassportVersion?.withheld.length ?? 0

  // The single most useful thing to do right now — a real priority order,
  // not a static list: an item needing revision blocks Passport eligibility
  // for that capability, so it outranks routine continuation.
  const primaryAction = disputedEvidence[0]
    ? {
        kind: 'evidence' as const,
        title: `Revise "${disputedEvidence[0].record.title}"`,
        why: disputedEvidence[0].review.rationale || 'A reviewer requested changes before this can support a capability claim.',
        affects: ['Evidence', 'Capability'],
        href: `/student/evidence/${disputedEvidence[0].record.id}`,
        time: '15-30 min',
      }
    : currentMilestone
      ? {
          kind: 'odyssey' as const,
          title: currentMilestone.title,
          why: currentMilestone.reasoningSummary,
          affects: ['Odyssey', 'Capability', ...(currentMilestone.evidenceRequirementIds.length ? ['Evidence'] : [])],
          href: `/student/odyssey?milestone=${currentMilestone.id}`,
          time: currentMilestone.estimatedEffort,
        }
      : {
          kind: 'learning' as const,
          title: `Continue "${learning.lesson.title}"`,
          why: `Current concept: ${learning.currentConceptTitle}. ${learning.independenceSummary}`,
          affects: ['Learning', 'Evidence', ...(learning.odysseyConnection ? ['Odyssey'] : [])],
          href: '/student/learning',
          time: '10-20 min',
        }

  // Capability condition, grouped by demonstrated maturity band rather than
  // a single averaged score — plus which claims have Evidence still pending
  // review, and which known capabilities have no claim at all yet.
  const bands = new Map<number, { label: string; claims: (CapabilityClaim & { definition?: CapabilityDefinition })[] }>()
  for (const claim of capabilityClaims) {
    const band = MATURITY_BAND[claim.maturity] ?? { label: claim.maturity, order: 5 }
    const entry = bands.get(band.order) ?? { label: band.label, claims: [] }
    entry.claims.push({ ...claim, definition: capabilityDefinitions.find((d) => d.id === claim.capabilityId) })
    bands.set(band.order, entry)
  }
  const claimedCapabilityIds = new Set(capabilityClaims.map((c) => c.capabilityId))
  const notYetObserved = capabilityDefinitions.filter((d) => !claimedCapabilityIds.has(d.id))
  const evidencePendingByCapability = new Set(
    evidence.filter((e) => e.review.status === 'pending').flatMap((e) => e.record.capabilityIds)
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <div>
        <p className="font-campus-mono text-[11px] uppercase tracking-widest text-campus-muted">
          {programme && institution ? `${programme.name} · ${institution.name}` : 'Syrka Campus'}
        </p>
        <h1 className="mt-1 font-campus-sans text-campus-2xl font-semibold tracking-tight text-campus-text">
          Welcome back, {currentUser.name.split(' ')[0]}.
        </h1>
      </div>

      {/* Primary next action — one dominant recommendation, not a card grid. */}
      <section aria-labelledby="primary-action-heading" className="rounded-campus-lg border border-campus-border bg-campus-surface p-6 md:p-8">
        <p id="primary-action-heading" className="font-campus-mono text-[10px] uppercase tracking-widest text-campus-muted">
          What Syrka recommends next
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-campus-sans text-campus-xl font-semibold text-campus-text md:text-campus-2xl">{primaryAction.title}</h2>
            <p className="mt-2 font-campus-sans text-campus-sm text-campus-muted">{primaryAction.why}</p>
          </div>
          <Link
            href={primaryAction.href}
            className="inline-flex shrink-0 items-center gap-2 rounded-campus-sm bg-campus-ink-950 px-5 py-2.5 font-campus-sans text-campus-sm font-medium text-campus-white transition-colors hover:bg-campus-ink-950/90 dark:bg-campus-stone-100 dark:text-campus-ink-950"
          >
            Start now <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-campus-border pt-4">
          {primaryAction.time && (
            <span className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">~{primaryAction.time}</span>
          )}
          <span className="text-campus-muted" aria-hidden="true">
            ·
          </span>
          <span className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Affects</span>
          {primaryAction.affects.map((a) => (
            <Badge key={a} tone="neutral">
              {a}
            </Badge>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex min-w-0 flex-col gap-8">
          {/* Continue Learning */}
          <section aria-labelledby="learning-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="learning-heading" className="flex items-center gap-2 font-campus-sans text-campus-lg font-medium text-campus-text">
                <BookOpen size={18} className="text-campus-muted" aria-hidden="true" /> Continue Learning
              </h2>
              <Link href="/student/learning" className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-muted hover:text-campus-text">
                Open <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <Link href="/student/learning" className="block rounded-campus-md border border-campus-border bg-campus-surface p-5 transition-colors hover:bg-campus-surface-raised">
              <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">
                {learning.course.title} · {learning.chapter.title}
              </p>
              <p className="mt-1 font-campus-sans text-campus-base font-medium text-campus-text">{learning.lesson.title}</p>
              <p className="mt-2 font-campus-sans text-campus-sm text-campus-muted">Current concept: {learning.currentConceptTitle}</p>
              <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">{learning.independenceSummary}</p>
              {learning.odysseyConnection && (
                <p className="mt-3 border-t border-campus-border pt-3 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
                  Supports {learning.odysseyConnection.capabilityName} → {learning.odysseyConnection.milestoneTitle}
                </p>
              )}
            </Link>
          </section>

          {/* Active Odyssey path */}
          <section aria-labelledby="odyssey-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="odyssey-heading" className="flex items-center gap-2 font-campus-sans text-campus-lg font-medium text-campus-text">
                <Compass size={18} className="text-campus-muted" aria-hidden="true" /> Odyssey
              </h2>
              <Link href="/student/odyssey" className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-muted hover:text-campus-text">
                Open roadmap <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
              <ol className="flex flex-col gap-3">
                {currentMilestone && (
                  <OdysseySegmentRow label="Current position" tone="blue" title={currentMilestone.title} detail={currentMilestone.reasoningSummary} href={`/student/odyssey?milestone=${currentMilestone.id}`} />
                )}
                {recommendedMilestone && recommendedMilestone.id !== currentMilestone?.id && (
                  <OdysseySegmentRow label="Recommended next" tone="amber" title={recommendedMilestone.title} detail={recommendedMilestone.reasoningSummary} href={`/student/odyssey?milestone=${recommendedMilestone.id}`} />
                )}
                {blockedMilestone && (
                  <OdysseySegmentRow label="Blocked" tone="red" title={blockedMilestone.title} detail={blockedMilestone.blockedReason ?? 'Prerequisites not yet met.'} href={`/student/odyssey?milestone=${blockedMilestone.id}`} />
                )}
                {destination && <OdysseySegmentRow label="Destination" tone="neutral" title={destination.title} detail={destination.description} href="/student/odyssey" />}
              </ol>
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          {/* Capability condition */}
          <section aria-labelledby="capability-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="capability-heading" className="font-campus-sans text-campus-lg font-medium text-campus-text">
                Capability condition
              </h2>
              <Link href="/student/capabilities" className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-muted hover:text-campus-text">
                View all <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <div className="flex flex-col gap-4 rounded-campus-md border border-campus-border bg-campus-surface p-5">
              {Array.from(bands.entries())
                .sort(([a], [b]) => a - b)
                .map(([order, { label, claims }]) => (
                  <div key={order}>
                    <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
                      {label} · {claims.length}
                    </p>
                    <div className="mt-1.5 flex flex-col gap-1.5">
                      {claims.map((claim) => (
                        <Link
                          key={claim.id}
                          href={`/student/capabilities/${claim.capabilityId}`}
                          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-campus-sm px-2 py-1.5 hover:bg-campus-surface-raised"
                        >
                          <span className="min-w-0 flex-1 truncate font-campus-sans text-campus-sm text-campus-text">{claim.definition?.name}</span>
                          <span className="flex shrink-0 items-center gap-2">
                            {evidencePendingByCapability.has(claim.capabilityId) && <Badge tone="amber">Evidence pending</Badge>}
                            <span className="font-campus-mono text-[11px] tabular-nums text-campus-muted">{Math.round(claim.confidence.score * 100)}%</span>
                            <span className="h-1.5 w-10 overflow-hidden rounded-full bg-campus-stone-300 dark:bg-campus-border" aria-hidden="true">
                              <span
                                className={`block h-full rounded-full ${
                                  claim.confidence.band === 'Strong' || claim.confidence.band === 'Verified'
                                    ? 'bg-campus-green-600 dark:bg-campus-green-dark'
                                    : claim.confidence.band === 'Supported'
                                      ? 'bg-campus-blue-600 dark:bg-campus-blue-dark'
                                      : claim.confidence.band === 'Emerging'
                                        ? 'bg-campus-amber-600 dark:bg-campus-amber-dark'
                                        : 'bg-campus-stone-500'
                                }`}
                                style={{ width: `${Math.round(claim.confidence.score * 100)}%` }}
                              />
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              {notYetObserved.length > 0 && (
                <div>
                  <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Not yet observed · {notYetObserved.length}</p>
                  <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">{notYetObserved.map((d) => d.name).join(', ')}</p>
                </div>
              )}
            </div>
          </section>

          {/* Career Passport condition */}
          <section aria-labelledby="passport-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="passport-heading" className="flex items-center gap-2 font-campus-sans text-campus-lg font-medium text-campus-text">
                <IdentificationCard size={18} className="text-campus-muted" aria-hidden="true" /> {PASSPORT_DISPLAY_NAME}
              </h2>
              <Link href="/student/passport" className="flex items-center gap-1 font-campus-sans text-campus-sm text-campus-muted hover:text-campus-text">
                Open <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            {passport && latestPassportVersion ? (
              <div className="flex flex-col gap-3 rounded-campus-md border border-campus-border bg-campus-surface p-5">
                <div className="flex items-center justify-between">
                  <span className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Version {passport.currentVersion}</span>
                  <Badge tone="gold">{passport.verificationSeal.issuer}</Badge>
                </div>
                <p className="font-campus-sans text-campus-sm text-campus-text">
                  {latestPassportVersion.claims.length} disclosed capability {latestPassportVersion.claims.length === 1 ? 'claim' : 'claims'}
                  {withheldCount > 0 ? `, ${withheldCount} withheld pending further Evidence` : ''}.
                </p>
                {recommendedMilestone && (
                  <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
                    Next likely eligible: {recommendedMilestone.title}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
                <p className="font-campus-sans text-campus-sm text-campus-muted">No Passport issued yet — issued once a capability meets the confidence threshold.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Evidence requiring action */}
      {(disputedEvidence.length > 0 || pendingEvidence.length > 0) && (
        <section aria-labelledby="evidence-action-heading">
          <h2 id="evidence-action-heading" className="mb-3 flex items-center gap-2 font-campus-sans text-campus-lg font-medium text-campus-text">
            <Warning size={18} className="text-campus-muted" aria-hidden="true" /> Evidence requiring action
          </h2>
          <div className="flex flex-col gap-2">
            {disputedEvidence.map((item) => (
              <Link
                key={item.record.id}
                href={`/student/evidence/${item.record.id}`}
                className="flex items-center justify-between gap-4 rounded-campus-md border border-campus-border bg-campus-surface p-4 transition-colors hover:bg-campus-surface-raised"
              >
                <div className="flex items-center gap-3">
                  <Badge tone="red">Revision requested</Badge>
                  <p className="font-campus-sans text-campus-sm text-campus-text">
                    <span className="font-medium">{item.record.title}</span> — {item.review.rationale || 'a reviewer requested changes'}
                  </p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-campus-muted" aria-hidden="true" />
              </Link>
            ))}
            {pendingEvidence.map((item) => (
              <Link
                key={item.record.id}
                href={`/student/evidence/${item.record.id}`}
                className="flex items-center justify-between gap-4 rounded-campus-md border border-campus-border bg-campus-surface p-4 transition-colors hover:bg-campus-surface-raised"
              >
                <div className="flex items-center gap-3">
                  <Status tone={item.review.status} />
                  <p className="font-campus-sans text-campus-sm text-campus-text">
                    <span className="font-medium">{item.record.title}</span> is awaiting faculty review.
                  </p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-campus-muted" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-2 rounded-campus-md border border-campus-border bg-campus-surface-raised p-4">
        <SyrkaIntelligenceState state="working" size="sm" label="Ask the Tutor about your Odyssey path or current lesson" />
      </div>
    </div>
  )
}

function OdysseySegmentRow({
  label,
  tone,
  title,
  detail,
  href,
}: {
  label: string
  tone: 'blue' | 'amber' | 'red' | 'neutral'
  title: string
  detail: string
  href: string
}) {
  const dot = {
    blue: 'bg-campus-blue-600 dark:bg-campus-blue-dark',
    amber: 'bg-campus-amber-600 dark:bg-campus-amber-dark',
    red: 'bg-campus-red-600 dark:bg-campus-red-dark',
    neutral: 'bg-campus-muted',
  }[tone]

  return (
    <li>
      <Link href={href} className="flex items-start gap-3 rounded-campus-sm px-2 py-1.5 hover:bg-campus-surface-raised">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
        <span className="min-w-0">
          <span className="block font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{label}</span>
          <span className="block truncate font-campus-sans text-campus-sm font-medium text-campus-text">{title}</span>
          <span className="line-clamp-1 font-campus-sans text-campus-xs text-campus-muted">{detail}</span>
        </span>
      </Link>
    </li>
  )
}
