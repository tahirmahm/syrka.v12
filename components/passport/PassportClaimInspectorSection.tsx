'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ContextualInspector } from '@/components/campus/ContextualInspector'
import { Badge } from '@/components/ui/Badge'
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter'
import { CLAIM_VERIFICATION_LABELS, CLAIM_VERIFICATION_TONES } from '@/lib/constants/passport'
import { formatDate } from '@/lib/utilities/format-relative-time'
import type { PassportClaim, EvidenceRecord, DisclosureSettings, CapabilityDefinition } from '@/lib/campus-types'

export interface PassportClaimInspectorSectionProps {
  claims: PassportClaim[]
  evidenceById: Map<string, EvidenceRecord>
  capabilityById: Map<string, CapabilityDefinition>
  disclosureSettings: DisclosureSettings
  issuedAt: string
}

function isDisclosedUnderCurrentSettings(claim: PassportClaim, settings: DisclosureSettings): boolean {
  if (settings.excludeStaleClaims && claim.verificationState === 'stale') return false
  if (settings.excludeRevokedClaims && claim.verificationState === 'revoked') return false
  return true
}

/**
 * The claims list, made interactive: selecting a claim opens the same
 * ContextualInspector pattern Odyssey uses, showing exactly what the
 * claim means, its real evidence basis (with each source's own
 * provenance), whether it currently survives the holder's own disclosure
 * settings, and its limits — never inventing fields the domain model
 * doesn't actually carry (no fabricated "authority score" or
 * "independence index").
 */
export function PassportClaimInspectorSection({ claims, evidenceById, capabilityById, disclosureSettings, issuedAt }: PassportClaimInspectorSectionProps) {
  const [selectedId, setSelectedId] = useState<string>()
  const selected = claims.find((c) => c.id === selectedId)
  const definition = selected ? capabilityById.get(selected.capabilityId) : undefined

  return (
    <div className={`grid gap-4 ${selected ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : 'lg:grid-cols-1'}`}>
      <div className="flex flex-col gap-3">
        {claims.map((claim) => {
          const disclosed = isDisclosedUnderCurrentSettings(claim, disclosureSettings)
          return (
            <button
              key={claim.id}
              type="button"
              onClick={() => setSelectedId(claim.id === selectedId ? undefined : claim.id)}
              aria-pressed={claim.id === selectedId}
              className={`flex flex-col gap-3 rounded-campus-md border p-5 text-left transition-colors print:break-inside-avoid ${
                claim.id === selectedId ? 'border-campus-ink-950 bg-campus-surface-raised dark:border-campus-stone-100' : 'border-campus-border bg-campus-surface hover:bg-campus-surface-raised/60'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-campus-sans text-campus-base font-medium text-campus-text">{claim.capabilityName}</p>
                  <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">{claim.capabilityDomain}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {!disclosed && <Badge tone="neutral">Not currently disclosed</Badge>}
                  <Badge tone={CLAIM_VERIFICATION_TONES[claim.verificationState]}>{CLAIM_VERIFICATION_LABELS[claim.verificationState]}</Badge>
                </div>
              </div>
              <ConfidenceMeter confidence={claim.confidence} />
              <p className="font-campus-mono text-campus-xs text-campus-muted">
                {claim.maturity} · {claim.evidenceIds.length} supporting evidence
              </p>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="lg:sticky lg:top-20 lg:h-fit">
          <ContextualInspector eyebrow="Capability claim" title={selected.capabilityName} onClose={() => setSelectedId(undefined)}>
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">What this claim means</p>
                <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">
                  {definition?.description ?? `Institutionally reviewed evidence supports ${selected.capabilityName} at ${selected.maturity} maturity.`}
                </p>
              </div>

              <div>
                <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Confidence and maturity</p>
                <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">
                  Maturity is how developed the capability is; confidence is how certain Syrka is in that assessment from the evidence available — kept as two separate signals, never blended into one score.
                </p>
                <div className="mt-2">
                  <ConfidenceMeter confidence={selected.confidence} />
                </div>
              </div>

              <div>
                <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Evidence basis ({selected.evidenceIds.length})</p>
                {selected.evidenceIds.length === 0 ? (
                  <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">No individual Evidence records are attached to this claim.</p>
                ) : (
                  <ul className="mt-1 flex flex-col gap-1.5">
                    {selected.evidenceIds.map((evidenceId) => {
                      const record = evidenceById.get(evidenceId)
                      return (
                        <li key={evidenceId}>
                          <Link href={`/student/evidence/${evidenceId}`} className="block rounded-campus-sm border border-campus-border p-2 hover:bg-campus-surface-raised">
                            <span className="font-campus-sans text-campus-xs font-medium text-campus-text">
                              {record?.title ?? evidenceId}
                              {evidenceId === selected.strongestEvidenceId && ' — strongest'}
                            </span>
                            {record && <span className="block font-campus-mono text-[10px] text-campus-muted">{record.provenance}</span>}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Review provenance</p>
                <p className="mt-1 font-campus-sans text-campus-xs text-campus-text">{selected.issuingContext}</p>
                <p className="mt-1 font-campus-mono text-[10px] text-campus-muted">Issued {formatDate(selected.issuedAt)} · Passport as of {formatDate(issuedAt)}</p>
              </div>

              {selected.limitations && (
                <div>
                  <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Limitations</p>
                  <p className="mt-1 font-campus-sans text-campus-xs text-campus-amber-600 dark:text-campus-amber-dark">{selected.limitations}</p>
                </div>
              )}

              <div>
                <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Disclosure</p>
                <p className="mt-1 font-campus-sans text-campus-xs text-campus-text">
                  {isDisclosedUnderCurrentSettings(selected, disclosureSettings)
                    ? 'Included under your current sharing settings.'
                    : `Excluded under your current sharing settings (${selected.verificationState === 'stale' ? 'stale claims are hidden' : 'revoked claims are hidden'}).`}
                </p>
              </div>
            </div>
          </ContextualInspector>
        </div>
      )}
    </div>
  )
}
