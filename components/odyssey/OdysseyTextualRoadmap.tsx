import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import type { ResolvedOdysseyMilestone } from '@/lib/utilities/odyssey-detail'
import { MILESTONE_STATUS_LABELS, MILESTONE_STATUS_TONES, MILESTONE_TYPE_LABELS } from '@/lib/constants/odyssey'

export interface OdysseyTextualRoadmapProps {
  orderedResolved: ResolvedOdysseyMilestone[]
  recommendedNextId?: string
  /** When provided, each row can open the same contextual inspector (Overview/Resources/AI Tutor) the roadmap view uses. */
  onSelectMilestone?: (milestoneId: string) => void
}

function MilestoneRow({ resolved, index, recommendedNextId, onSelectMilestone }: { resolved: ResolvedOdysseyMilestone; index: number; recommendedNextId?: string; onSelectMilestone?: (id: string) => void }) {
  const { milestone } = resolved
  return (
    <li>
      <Panel className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-campus-border font-campus-mono text-campus-xs text-campus-muted">
              {index + 1}
            </span>
            <div>
              <h3 className="font-campus-sans text-campus-base font-medium text-campus-text">{milestone.title}</h3>
              <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{MILESTONE_TYPE_LABELS[milestone.type]}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {milestone.id === recommendedNextId && <Badge tone="amber">Recommended next</Badge>}
            <Badge tone={MILESTONE_STATUS_TONES[milestone.status]}>{MILESTONE_STATUS_LABELS[milestone.status]}</Badge>
          </div>
        </div>

        <p className="font-campus-sans text-campus-sm text-campus-text">{milestone.description}</p>

        {resolved.prerequisites.length > 0 && (
          <p className="font-campus-sans text-campus-xs text-campus-muted">
            Requires: {resolved.prerequisites.map((p) => p.title).join(', ')}
          </p>
        )}

        {resolved.evidenceRequirements.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {resolved.evidenceRequirements.map((req) => (
              <Badge key={req.id} tone="neutral">
                Evidence: {req.description}
              </Badge>
            ))}
          </div>
        )}

        {resolved.blocker && (
          <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">Blocked: {resolved.blocker.reason}</p>
        )}

        {resolved.actions[0] && (
          <p className="font-campus-sans text-campus-sm text-campus-blue-600 dark:text-campus-blue-dark">
            Next action: {resolved.actions[0].title}
          </p>
        )}

        {resolved.expectedImpacts.length > 0 && (
          <p className="font-campus-sans text-campus-xs text-campus-muted">
            Expected impact (projection): {resolved.expectedImpacts.map((i) => `${i.capabilityName} → ${i.projectedMaturity}`).join(', ')}
          </p>
        )}

        {resolved.alternatives.length > 0 && (
          <details className="font-campus-sans text-campus-xs text-campus-muted">
            <summary className="cursor-pointer text-campus-text">Alternative routes ({resolved.alternatives.length})</summary>
            <ul className="mt-2 flex flex-col gap-2">
              {resolved.alternatives.map((alt) => (
                <li key={alt.id}>
                  <span className="font-medium text-campus-text">{alt.title}</span> — {alt.description}{' '}
                  <span className="italic">Trade-off: {alt.tradeoff}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        <p className="font-campus-sans text-campus-xs text-campus-muted">If complete: {milestone.completionImpact}</p>

        {onSelectMilestone && (
          <button
            type="button"
            onClick={() => onSelectMilestone(milestone.id)}
            className="w-fit font-campus-sans text-campus-xs font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark"
          >
            Open detail &amp; AI Tutor →
          </button>
        )}
      </Panel>
    </li>
  )
}

/**
 * The fully accessible, no-graph-required alternative view — keyboard,
 * screen reader, narrow-screen, and print all work from this component
 * alone. Never merely a fallback afterthought: every fact the graph shows
 * is also here in ordered, readable form.
 *
 * When milestones carry a `subjectLane` (the NCERT Class X curriculum-
 * progression pathway), they're grouped into collapsible `<details>`
 * sections per subject — the "four collapsible subject lanes" the
 * Odyssey product correction asks for, delivered here rather than as a
 * separate graph-layout rewrite. Milestones without a `subjectLane`
 * (the preserved university/career-pathway fixture) render exactly as
 * before, ungrouped.
 */
export function OdysseyTextualRoadmap({ orderedResolved, recommendedNextId, onSelectMilestone }: OdysseyTextualRoadmapProps) {
  const hasLanes = orderedResolved.some((r) => r.milestone.subjectLane)

  if (!hasLanes) {
    return (
      <ol className="flex flex-col gap-3">
        {orderedResolved.map((resolved, index) => (
          <MilestoneRow key={resolved.milestone.id} resolved={resolved} index={index} recommendedNextId={recommendedNextId} onSelectMilestone={onSelectMilestone} />
        ))}
      </ol>
    )
  }

  const lanes: { lane: string; items: { resolved: ResolvedOdysseyMilestone; index: number }[] }[] = []
  orderedResolved.forEach((resolved, index) => {
    const lane = resolved.milestone.subjectLane ?? 'Overall'
    let group = lanes.find((l) => l.lane === lane)
    if (!group) {
      group = { lane, items: [] }
      lanes.push(group)
    }
    group.items.push({ resolved, index })
  })

  return (
    <div className="flex flex-col gap-4">
      {lanes.map((group) => (
        <details key={group.lane} open className="rounded-campus-md border border-campus-border bg-campus-surface">
          <summary className="cursor-pointer px-4 py-3 font-campus-sans text-campus-sm font-medium text-campus-text">
            {group.lane} <span className="font-campus-mono text-[10px] font-normal uppercase tracking-wide text-campus-muted">({group.items.length})</span>
          </summary>
          <ol className="flex flex-col gap-3 border-t border-campus-border p-3">
            {group.items.map(({ resolved, index }) => (
              <MilestoneRow key={resolved.milestone.id} resolved={resolved} index={index} recommendedNextId={recommendedNextId} onSelectMilestone={onSelectMilestone} />
            ))}
          </ol>
        </details>
      ))}
    </div>
  )
}
