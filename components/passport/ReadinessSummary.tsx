import Link from 'next/link'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import type { PassportVersion } from '@/lib/campus-types'

export function ReadinessSummary({ version, pendingEvidenceCount }: { version: PassportVersion; pendingEvidenceCount: number }) {
  const staleClaims = version.claims.filter((c) => c.verificationState === 'stale')
  const revokedClaims = version.claims.filter((c) => c.verificationState === 'revoked')
  const shareableClaims = version.claims.filter((c) => c.verificationState !== 'revoked')

  return (
    <Panel className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="font-campus-mono text-campus-2xl font-semibold text-campus-text">{shareableClaims.length}</p>
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Ready to share</p>
        </div>
        <div>
          <p className="font-campus-mono text-campus-2xl font-semibold text-campus-text">{version.withheld.length}</p>
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Not yet included</p>
        </div>
        <div>
          <p className="font-campus-mono text-campus-2xl font-semibold text-campus-text">{pendingEvidenceCount}</p>
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Awaiting review</p>
        </div>
        <div>
          <p className="font-campus-mono text-campus-2xl font-semibold text-campus-text">{revokedClaims.length}</p>
          <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Revoked</p>
        </div>
      </div>

      {version.withheld.length > 0 && (
        <div className="border-t border-campus-border pt-4">
          <p className="mb-2 font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Not yet included</p>
          <div className="flex flex-col gap-1.5">
            {version.withheld.map((w) => (
              <p key={w.capabilityId} className="font-campus-sans text-campus-sm text-campus-text">
                <span className="font-medium">{w.capabilityName}</span> — {w.reason}
              </p>
            ))}
          </div>
        </div>
      )}

      {staleClaims.length > 0 && (
        <div className="border-t border-campus-border pt-4">
          <p className="mb-2 font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Would strengthen your Passport</p>
          <div className="flex flex-col gap-1.5">
            {staleClaims.map((c) => (
              <p key={c.id} className="font-campus-sans text-campus-sm text-campus-text">
                <Badge tone="neutral" className="mr-1.5">Stale</Badge>
                Refresh evidence for <span className="font-medium">{c.capabilityName}</span>.
              </p>
            ))}
          </div>
          <Link href="/student/odyssey" className="mt-2 inline-block font-campus-sans text-campus-sm text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
            See recommended actions in Odyssey
          </Link>
        </div>
      )}
    </Panel>
  )
}
