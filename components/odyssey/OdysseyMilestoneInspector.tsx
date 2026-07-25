'use client'

import type { ReactNode } from 'react'
import { X, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { Badge } from '@/components/ui/Badge'
import type { ResolvedOdysseyMilestone } from '@/lib/utilities/odyssey-detail'
import { MILESTONE_STATUS_LABELS, MILESTONE_STATUS_TONES, MILESTONE_TYPE_LABELS } from '@/lib/constants/odyssey'

export interface OdysseyMilestoneInspectorProps {
  resolved: ResolvedOdysseyMilestone
  onClose: () => void
}

function passportImplication(resolved: ResolvedOdysseyMilestone): string {
  if (resolved.expectedImpacts.length === 0) return 'No direct effect on your Academic Passport is projected for this milestone.'
  const names = resolved.expectedImpacts.map((i) => i.capabilityName).join(', ')
  return `Completing this — once reviewed — could add or strengthen a Passport claim for: ${names}. This is a projection, not a guarantee.`
}

/** The node-detail experience: everything the compact roadmap node can't show at-a-glance. */
export function OdysseyMilestoneInspector({ resolved, onClose }: OdysseyMilestoneInspectorProps) {
  const { milestone } = resolved
  const requiresReview = resolved.actions.some((a) => a.requiresReview)

  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-campus-md border border-campus-border bg-campus-surface p-4" aria-label={`Detail for ${milestone.title}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{MILESTONE_TYPE_LABELS[milestone.type]}</p>
          <h3 className="mt-0.5 font-campus-sans text-campus-base font-semibold text-campus-text">{milestone.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close milestone detail"
          className="shrink-0 rounded-campus-sm p-1.5 text-campus-muted hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone={MILESTONE_STATUS_TONES[milestone.status]}>{MILESTONE_STATUS_LABELS[milestone.status]}</Badge>
        <Badge tone="neutral">Recommendation confidence: {milestone.recommendationConfidence}</Badge>
      </div>

      <p className="mt-3 font-campus-sans text-campus-sm text-campus-text">{milestone.description}</p>

      <Section title="Why this was recommended">
        <p className="font-campus-sans text-campus-sm text-campus-text">{milestone.reasoningSummary}</p>
      </Section>

      {resolved.capabilityNames.length > 0 && (
        <Section title="Capability addressed">
          <div className="flex flex-wrap gap-1.5">
            {resolved.capabilityNames.map((name) => (
              <Badge key={name} tone="neutral">
                {name}
              </Badge>
            ))}
          </div>
          {(milestone.currentMaturity || milestone.targetMaturity) && (
            <p className="mt-2 font-campus-sans text-campus-xs text-campus-muted">
              {milestone.currentMaturity ?? 'Unassessed'} → {milestone.targetMaturity ?? '—'} maturity ·{' '}
              {milestone.currentConfidence ?? 'Unassessed'} → {milestone.targetConfidence ?? '—'} confidence
            </p>
          )}
        </Section>
      )}

      {resolved.prerequisites.length > 0 && (
        <Section title="Prerequisites">
          <ul className="flex flex-col gap-1 font-campus-sans text-campus-sm text-campus-text">
            {resolved.prerequisites.map((p) => (
              <li key={p.id}>{p.title}</li>
            ))}
          </ul>
        </Section>
      )}

      {resolved.actions.length > 0 && (
        <Section title="Recommended action">
          {resolved.actions.map((action) => (
            <div key={action.id} className="mb-2 last:mb-0">
              <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{action.title}</p>
              <p className="font-campus-sans text-campus-xs text-campus-muted">{action.description}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge tone={action.isAiProposed ? 'amber' : 'neutral'}>
                  {action.isAiProposed ? (
                    <span className="flex items-center gap-1">
                      <Sparkle size={11} weight="fill" aria-hidden="true" /> AI-proposed — institutional availability unconfirmed
                    </span>
                  ) : (
                    'Canonical institutional resource'
                  )}
                </Badge>
                {action.requiresReview && <Badge tone="blue">Requires Faculty review</Badge>}
              </div>
            </div>
          ))}
        </Section>
      )}

      {milestone.estimatedEffort && (
        <Section title="Estimated effort">
          <p className="font-campus-sans text-campus-sm text-campus-text">{milestone.estimatedEffort}</p>
        </Section>
      )}

      {resolved.evidenceRequirements.length > 0 && (
        <Section title="Required Evidence">
          <ul className="flex flex-col gap-1 font-campus-sans text-campus-sm text-campus-text">
            {resolved.evidenceRequirements.map((req) => (
              <li key={req.id}>{req.description}</li>
            ))}
          </ul>
        </Section>
      )}

      {resolved.expectedImpacts.length > 0 && (
        <Section title="Expected capability impact (projection)">
          <ul className="flex flex-col gap-1 font-campus-sans text-campus-sm text-campus-text">
            {resolved.expectedImpacts.map((impact) => (
              <li key={impact.id}>
                {impact.capabilityName} → {impact.projectedMaturity} maturity, {impact.projectedConfidence} confidence
              </li>
            ))}
          </ul>
        </Section>
      )}

      {milestone.blockedReason && (
        <Section title="Blocker">
          <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">{milestone.blockedReason}</p>
        </Section>
      )}

      {resolved.alternatives.length > 0 && (
        <Section title="Alternatives">
          <ul className="flex flex-col gap-2">
            {resolved.alternatives.map((alt) => (
              <li key={alt.id} className="font-campus-sans text-campus-sm text-campus-text">
                <span className="font-medium">{alt.title}</span> — {alt.description}
                <p className="font-campus-sans text-campus-xs text-campus-muted">Trade-off: {alt.tradeoff}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {resolved.unlocks.length > 0 && (
        <Section title="What completion unlocks">
          <ul className="flex flex-col gap-1 font-campus-sans text-campus-sm text-campus-text">
            {resolved.unlocks.map((u) => (
              <li key={u.id}>{u.title}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Academic Passport implication">
        <p className="font-campus-sans text-campus-sm text-campus-text">{passportImplication(resolved)}</p>
      </Section>

      {requiresReview && (
        <Section title="Human review">
          <p className="font-campus-sans text-campus-sm text-campus-text">
            Faculty review is required before Evidence from this milestone can strengthen your capability profile.
          </p>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4 border-t border-campus-border pt-3">
      <p className="mb-1.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{title}</p>
      {children}
    </div>
  )
}
