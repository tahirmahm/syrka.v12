import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import type { PassportVersion, CapabilityDefinition } from '@/lib/campus-types'
import { formatDate } from '@/lib/utilities/format-relative-time'

export interface PassportVersionHistoryProps {
  versions: PassportVersion[]
  currentVersion: number
  capabilityById: Map<string, CapabilityDefinition>
}

function names(ids: string[], capabilityById: Map<string, CapabilityDefinition>): string {
  return ids.map((id) => capabilityById.get(id)?.name ?? id).join(', ')
}

export function PassportVersionHistory({ versions, currentVersion, capabilityById }: PassportVersionHistoryProps) {
  const ordered = [...versions].sort((a, b) => b.version - a.version)

  return (
    <ol className="flex flex-col gap-3">
      {ordered.map((version) => (
        <li key={version.version}>
          <Panel className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Version {version.version}</span>
              {version.version === currentVersion && <Badge tone="blue">Current</Badge>}
              <span className="font-campus-mono text-campus-xs text-campus-muted">{formatDate(version.issuedAt)}</span>
            </div>
            {version.reissueReason && <p className="font-campus-sans text-campus-sm text-campus-text">{version.reissueReason}</p>}
            <div className="flex flex-col gap-1">
              {version.claimsAddedCapabilityIds.length > 0 && (
                <p className="font-campus-sans text-campus-xs text-campus-green-600 dark:text-campus-green-dark">
                  Added: {names(version.claimsAddedCapabilityIds, capabilityById)}
                </p>
              )}
              {version.claimsUpdatedCapabilityIds.length > 0 && (
                <p className="font-campus-sans text-campus-xs text-campus-blue-600 dark:text-campus-blue-dark">
                  Updated: {names(version.claimsUpdatedCapabilityIds, capabilityById)}
                </p>
              )}
              {version.claimsRevokedCapabilityIds.length > 0 && (
                <p className="font-campus-sans text-campus-xs text-campus-red-600 dark:text-campus-red-dark">
                  Revoked: {names(version.claimsRevokedCapabilityIds, capabilityById)}
                </p>
              )}
            </div>
          </Panel>
        </li>
      ))}
    </ol>
  )
}
