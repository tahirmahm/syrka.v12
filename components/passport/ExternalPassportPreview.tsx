import { Badge } from '@/components/ui/Badge'
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter'
import type { ExternalPassportView } from '@/lib/campus-types'
import { CLAIM_VERIFICATION_LABELS, CLAIM_VERIFICATION_TONES, AUDIENCE_LABELS } from '@/lib/constants/passport'
import { formatDate } from '@/lib/utilities/format-relative-time'

export function ExternalPassportPreview({ view }: { view: ExternalPassportView }) {
  return (
    <div className="rounded-campus-md border border-campus-border bg-campus-silver p-6 dark:bg-campus-surface-raised">
      <div className="mb-4 flex items-center justify-between">
        <Badge tone="neutral">Preview disclosure · {AUDIENCE_LABELS[view.audience]}</Badge>
        <span className="font-campus-mono text-campus-xs text-campus-muted">v{view.version} · {formatDate(view.issuedAt)}</span>
      </div>
      <p className="font-campus-sans text-campus-lg font-medium text-campus-text">{view.studentName ?? 'Name withheld'}</p>
      <p className="font-campus-sans text-campus-sm text-campus-muted">
        {view.programmeName ? `${view.programmeName} · ` : ''}
        {view.institutionName}
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {view.claims.length === 0 ? (
          <p className="font-campus-sans text-campus-sm text-campus-muted">No claims are visible under the current disclosure settings.</p>
        ) : (
          view.claims.map((claim) => (
            <div key={claim.capabilityName} className="rounded-campus-sm border border-campus-border bg-campus-surface p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{claim.capabilityName}</p>
                  <p className="font-campus-mono text-campus-xs text-campus-muted">{claim.capabilityDomain}</p>
                </div>
                <Badge tone={CLAIM_VERIFICATION_TONES[claim.verificationState]}>{CLAIM_VERIFICATION_LABELS[claim.verificationState]}</Badge>
              </div>
              <div className="mt-3">
                <ConfidenceMeter confidence={claim.confidence} />
              </div>
              <p className="mt-2 font-campus-mono text-campus-xs text-campus-muted">
                {claim.maturity} · {claim.evidenceCount} evidence
                {claim.courseContext && ` · ${claim.courseContext}`}
              </p>
              {claim.reviewerContext && <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">{claim.reviewerContext}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
