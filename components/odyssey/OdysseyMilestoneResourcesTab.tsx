import { Sparkle, Warning } from '@phosphor-icons/react/dist/ssr'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ResolvedOdysseyMilestone } from '@/lib/utilities/odyssey-detail'
import type { OdysseyInstitutionalResource } from '@/lib/campus-types'

export interface OdysseyMilestoneResourcesTabProps {
  resolved: ResolvedOdysseyMilestone
  resourceById: Map<string, OdysseyInstitutionalResource>
}

/**
 * Distinguishes available institutional resources, AI-proposed actions, and
 * unavailable references — never presenting an AI-proposed action as
 * institutionally confirmed, and never fabricating availability.
 */
export function OdysseyMilestoneResourcesTab({ resolved, resourceById }: OdysseyMilestoneResourcesTabProps) {
  const { milestone } = resolved

  const relatedResources = Array.from(resourceById.values()).filter(
    (r) => r.relatedCapabilityIds.some((id) => milestone.capabilityIds.includes(id)) && !resolved.actions.some((a) => a.resourceId === r.id)
  )

  if (resolved.actions.length === 0 && relatedResources.length === 0) {
    return (
      <div className="mt-3">
        <EmptyState title="No resources attached" description="This milestone has no recommended action or related institutional resource yet." />
      </div>
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-4">
      {resolved.actions.length > 0 && (
        <div>
          <p className="mb-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Recommended for this milestone</p>
          <div className="flex flex-col gap-2">
            {resolved.actions.map((action) => {
              const resource = action.resourceId ? resourceById.get(action.resourceId) : undefined
              return (
                <div key={action.id} className="rounded-campus-sm border border-campus-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{resource?.title ?? action.title}</p>
                    {resource ? (
                      <Badge tone="green">Available institutional resource</Badge>
                    ) : action.isAiProposed ? (
                      <Badge tone="amber">
                        <span className="flex items-center gap-1">
                          <Sparkle size={11} weight="fill" aria-hidden="true" /> AI-proposed
                        </span>
                      </Badge>
                    ) : (
                      <Badge tone="red">
                        <span className="flex items-center gap-1">
                          <Warning size={11} weight="fill" aria-hidden="true" /> Unavailable
                        </span>
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">{resource?.description ?? action.description}</p>
                  {resource && (resource.workloadEstimate || resource.deliveryMode) && (
                    <p className="mt-1.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
                      {[resource.workloadEstimate, resource.deliveryMode].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {!resource && action.isAiProposed && (
                    <p className="mt-1.5 font-campus-sans text-[11px] text-campus-muted">
                      No matching canonical institutional resource was found — treat this as a suggestion to evaluate, not a confirmed offering.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {relatedResources.length > 0 && (
        <div>
          <p className="mb-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Other related institutional resources</p>
          <div className="flex flex-col gap-2">
            {relatedResources.map((r) => (
              <div key={r.id} className="rounded-campus-sm border border-campus-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{r.title}</p>
                  <Badge tone="neutral">{r.type.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
