import Link from 'next/link'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import type { OdysseyMilestone, CapabilityDefinition } from '@/lib/campus-types'
import { MILESTONE_STATUS_LABELS, MILESTONE_STATUS_TONES } from '@/lib/constants/odyssey'

export interface OdysseyMilestoneRowProps {
  milestone: OdysseyMilestone
  capabilityById: Map<string, CapabilityDefinition>
}

export function OdysseyMilestoneRow({ milestone, capabilityById }: OdysseyMilestoneRowProps) {
  return (
    <li>
      <Panel className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-campus-border font-campus-mono text-campus-xs text-campus-muted">
              {milestone.order}
            </span>
            <h3 className="font-campus-sans text-campus-base font-medium text-campus-text">{milestone.title}</h3>
          </div>
          <Badge tone={MILESTONE_STATUS_TONES[milestone.status]}>{MILESTONE_STATUS_LABELS[milestone.status]}</Badge>
        </div>

        <p className="font-campus-sans text-campus-sm text-campus-text">{milestone.description}</p>
        <p className="font-campus-sans text-campus-xs text-campus-muted">{milestone.rationale}</p>

        {milestone.requirements.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {milestone.requirements.map((req) => {
              const capability = capabilityById.get(req.capabilityId)
              return capability ? (
                <Link key={req.capabilityId} href={`/student/capabilities/${req.capabilityId}`}>
                  <Badge tone="neutral">
                    {capability.name} · {req.minimumMaturity}+
                  </Badge>
                </Link>
              ) : null
            })}
          </div>
        )}

        {milestone.blockedReason && (
          <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">Blocked: {milestone.blockedReason}</p>
        )}
        {milestone.recommendedAction && (
          <p className="font-campus-sans text-campus-sm text-campus-blue-600 dark:text-campus-blue-dark">Next action: {milestone.recommendedAction}</p>
        )}
        <p className="font-campus-sans text-campus-xs text-campus-muted">If complete: {milestone.completionImpact}</p>
      </Panel>
    </li>
  )
}
