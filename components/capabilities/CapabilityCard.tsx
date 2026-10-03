import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter'
import type { CapabilityDefinition, CapabilityClaim } from '@/lib/campus-types'

export function CapabilityCard({ definition, claim }: { definition: CapabilityDefinition; claim?: CapabilityClaim }) {
  return (
    <Link href={`/student/capabilities/${definition.id}`}>
      <Card interactive className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-campus-sans text-campus-base font-medium text-campus-text">{definition.name}</p>
            <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">{definition.domain}</p>
          </div>
          <Badge tone="neutral">{claim ? claim.maturity : 'No claim'}</Badge>
        </div>
        {claim ? (
          <ConfidenceMeter confidence={claim.confidence} />
        ) : (
          <p className="font-campus-sans text-campus-sm text-campus-muted">Insufficient evidence to support a claim yet.</p>
        )}
      </Card>
    </Link>
  )
}
