import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter'
import type { PassportClaim } from '@/lib/campus-types'
import { CLAIM_VERIFICATION_LABELS, CLAIM_VERIFICATION_TONES } from '@/lib/constants/passport'

export function PassportClaimRow({ claim }: { claim: PassportClaim }) {
  return (
    <div className="flex flex-col gap-3 rounded-campus-md border border-campus-border bg-campus-surface p-5 print:break-inside-avoid">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={`/student/capabilities/${claim.capabilityId}`} className="font-campus-sans text-campus-base font-medium text-campus-text hover:underline">
            {claim.capabilityName}
          </Link>
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">{claim.capabilityDomain}</p>
        </div>
        <Badge tone={CLAIM_VERIFICATION_TONES[claim.verificationState]}>{CLAIM_VERIFICATION_LABELS[claim.verificationState]}</Badge>
      </div>

      <ConfidenceMeter confidence={claim.confidence} />

      <p className="font-campus-mono text-campus-xs text-campus-muted">
        {claim.maturity} · {claim.evidenceIds.length} supporting evidence
      </p>

      {claim.evidenceIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {claim.evidenceIds.map((evidenceId) => (
            <Link key={evidenceId} href={`/student/evidence/${evidenceId}`}>
              <Badge tone="neutral">
                {evidenceId === claim.strongestEvidenceId ? 'Strongest evidence' : 'Evidence'}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <p className="font-campus-sans text-campus-xs text-campus-muted">{claim.issuingContext}</p>
      {claim.limitations && <p className="font-campus-sans text-campus-xs text-campus-amber-600 dark:text-campus-amber-dark">{claim.limitations}</p>}
    </div>
  )
}
