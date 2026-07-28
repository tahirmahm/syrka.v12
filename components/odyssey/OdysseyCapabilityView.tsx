import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import type { ResolvedOdysseyMilestone } from '@/lib/utilities/odyssey-detail'
import { MILESTONE_STATUS_LABELS, MILESTONE_STATUS_TONES } from '@/lib/constants/odyssey'

export interface OdysseyCapabilityViewProps {
  orderedResolved: ResolvedOdysseyMilestone[]
}

/**
 * Cross-subject Capability formation — one row per Capability, showing
 * which subjects/milestones actually contribute to it. Every relationship
 * here traces to a real milestone's capabilityIds/status; nothing is a
 * fabricated cross-subject score. Powered by the same reviewed-Evidence
 * and curriculum data the Curriculum view uses, never a second data path.
 */
export function OdysseyCapabilityView({ orderedResolved }: OdysseyCapabilityViewProps) {
  const byCapability = new Map<string, { name: string; items: ResolvedOdysseyMilestone[] }>()
  for (const resolved of orderedResolved) {
    resolved.milestone.capabilityIds.forEach((capId, i) => {
      const name = resolved.capabilityNames[i] ?? capId
      const existing = byCapability.get(capId)
      if (existing) existing.items.push(resolved)
      else byCapability.set(capId, { name, items: [resolved] })
    })
  }

  if (byCapability.size === 0) {
    return <p className="font-campus-sans text-campus-sm text-campus-muted">No Capability relationships are attached to the current plan yet.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {Array.from(byCapability.entries()).map(([capId, group]) => {
        const verifiedCount = group.items.filter((r) => r.milestone.status === 'verified').length
        const transferItem = group.items.find((r) => r.milestone.type === 'chapter_progress' && r.milestone.status === 'verified')
        return (
          <Panel key={capId} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-campus-sans text-campus-base font-medium text-campus-text">{group.name}</h3>
              <Badge tone={verifiedCount > 0 ? 'green' : 'neutral'}>
                {verifiedCount} of {group.items.length} contributing {group.items.length === 1 ? 'milestone' : 'milestones'} verified
              </Badge>
            </div>
            {transferItem && (
              <p className="font-campus-sans text-campus-xs text-campus-text">
                Supported by independent transfer, confirmed by a delayed retention check, on <span className="font-medium">{transferItem.milestone.subjectLane}</span> — “{transferItem.milestone.title}”.
              </p>
            )}
            <ul className="flex flex-col gap-1.5">
              {group.items.map((r) => (
                <li key={r.milestone.id} className="flex items-center justify-between gap-2 border-t border-campus-border pt-1.5 first:border-t-0 first:pt-0">
                  <span className="font-campus-sans text-campus-xs text-campus-text">
                    {r.milestone.subjectLane ? `${r.milestone.subjectLane} — ` : ''}
                    {r.milestone.title}
                  </span>
                  <Badge tone={MILESTONE_STATUS_TONES[r.milestone.status]}>{MILESTONE_STATUS_LABELS[r.milestone.status]}</Badge>
                </li>
              ))}
            </ul>
          </Panel>
        )
      })}
    </div>
  )
}
