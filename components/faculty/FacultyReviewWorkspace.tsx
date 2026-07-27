'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from '@phosphor-icons/react/dist/ssr'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ReviewDecisionType, EvidenceLimitationTag, ProvenanceConcernType, ReviewImpactPreview } from '@/lib/campus-types'
import { DECISION_TYPE_LABELS, DECISION_TYPE_TONES, LIMITATION_TAG_LABELS, PROVENANCE_CONCERN_LABELS } from '@/lib/constants/faculty'

const DECISION_TYPES: ReviewDecisionType[] = ['approve', 'request_revision', 'request_clarification', 'dispute_attribution', 'revoke', 'confirm_supersession']
const LIMITATION_TAGS: EvidenceLimitationTag[] = ['single_context', 'stale_context', 'insufficient_detail', 'unclear_attribution', 'partial_capability_coverage']
const PROVENANCE_CONCERNS: ProvenanceConcernType[] = ['unclear_authorship', 'unverifiable_source', 'possible_duplication', 'external_credential_unverified']

const REQUIRES_STUDENT_RESPONSE: Partial<Record<ReviewDecisionType, boolean>> = {
  request_revision: true,
  request_clarification: true,
  dispute_attribution: true,
}

export interface FacultyReviewWorkspaceProps {
  evidenceId: string
  studentName: string
  linkedCapabilities: { id: string; name: string }[]
  impactPreviewByDecision: Record<ReviewDecisionType, ReviewImpactPreview>
}

export function FacultyReviewWorkspace({ evidenceId, studentName, linkedCapabilities, impactPreviewByDecision }: FacultyReviewWorkspaceProps) {
  const router = useRouter()
  const [decisionType, setDecisionType] = useState<ReviewDecisionType>('approve')
  const [rationale, setRationale] = useState('')
  const [limitations, setLimitations] = useState<EvidenceLimitationTag[]>([])
  const [supportedCapabilityIds, setSupportedCapabilityIds] = useState<string[]>([])
  const [unsupportedCapabilityIds, setUnsupportedCapabilityIds] = useState<string[]>([])
  const [provenanceConcern, setProvenanceConcern] = useState<ProvenanceConcernType | ''>('')
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const [result, setResult] = useState<{ message: string; updatedStatus: string }>()

  const preview = impactPreviewByDecision[decisionType]

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  function handleReviewClick(event: FormEvent) {
    event.preventDefault()
    if (!rationale.trim()) {
      setError('A rationale is required before reviewing this decision.')
      return
    }
    setError(undefined)
    setStep('confirm')
  }

  async function handleConfirm() {
    setPending(true)
    setError(undefined)
    try {
      const response = await fetch(`/api/faculty/evidence/${evidenceId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionType, rationale, limitations, supportedCapabilityIds, unsupportedCapabilityIds, provenanceConcern: provenanceConcern || undefined }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'The review decision could not be recorded.')
        return
      }
      setResult({ message: data.message, updatedStatus: data.updatedStatus })
      router.refresh()
    } catch {
      setError('The request could not be sent. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  const requiresResponse = useMemo(() => Boolean(REQUIRES_STUDENT_RESPONSE[decisionType]), [decisionType])

  if (result) {
    return (
      <Panel className="flex flex-col gap-2 border-campus-green-600 dark:border-campus-green-dark">
        <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Review recorded</p>
        <p className="font-campus-sans text-campus-sm text-campus-text">{result.message}</p>
        <p className="font-campus-sans text-campus-sm text-campus-text">
          Evidence status is now <Badge tone="neutral">{result.updatedStatus}</Badge>. This is session-only demo state — it is not written to a permanent institutional record.
        </p>
      </Panel>
    )
  }

  if (step === 'confirm') {
    return (
      <Panel className="flex flex-col gap-4">
        <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Confirm review decision</p>
        <dl className="grid gap-3 text-campus-sm sm:grid-cols-2">
          <div>
            <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Decision</dt>
            <dd className="mt-0.5">
              <Badge tone={DECISION_TYPE_TONES[decisionType]}>{DECISION_TYPE_LABELS[decisionType]}</Badge>
            </dd>
          </div>
          <div>
            <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Student</dt>
            <dd className="mt-0.5 text-campus-text">{studentName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Rationale</dt>
            <dd className="mt-0.5 text-campus-text">{rationale}</dd>
          </div>
          {linkedCapabilities.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Linked capability claims</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {linkedCapabilities.map((c) => (
                  <Badge key={c.id} tone="neutral">
                    {c.name}
                  </Badge>
                ))}
              </dd>
            </div>
          )}
        </dl>

        <ImpactPreviewPanel preview={preview} />

        <p className="font-campus-sans text-campus-sm text-campus-text">
          {requiresResponse ? 'The student will need to respond before this Evidence can be reviewed again.' : 'No further student response is required by this action alone.'}
        </p>

        {error && <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">{error}</p>}

        <div className="flex items-center gap-2">
          <Button onClick={handleConfirm} loading={pending}>
            Confirm decision
          </Button>
          <Button variant="secondary" onClick={() => setStep('form')} disabled={pending}>
            Back
          </Button>
        </div>
      </Panel>
    )
  }

  return (
    <Panel className="flex flex-col gap-4" role="form" aria-label="Review this Evidence">
      <form onSubmit={handleReviewClick} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-1.5">
          <legend className="font-campus-sans text-campus-sm font-medium text-campus-text">Decision</legend>
          <div className="flex flex-wrap gap-2">
            {DECISION_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-1.5 font-campus-sans text-campus-sm text-campus-text">
                <input type="radio" name="decisionType" checked={decisionType === type} onChange={() => setDecisionType(type)} className="h-4 w-4" />
                {DECISION_TYPE_LABELS[type]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rationale" className="font-campus-sans text-campus-sm font-medium text-campus-text">
            Rationale <span className="text-campus-red-600 dark:text-campus-red-dark">(required)</span>
          </label>
          <textarea
            id="rationale"
            required
            rows={3}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            className="rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
        </div>

        {linkedCapabilities.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="flex flex-col gap-1.5">
              <legend className="font-campus-sans text-campus-sm font-medium text-campus-text">Capabilities this Evidence supports</legend>
              {linkedCapabilities.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 font-campus-sans text-campus-sm text-campus-text">
                  <input type="checkbox" checked={supportedCapabilityIds.includes(c.id)} onChange={() => toggle(supportedCapabilityIds, setSupportedCapabilityIds, c.id)} className="h-4 w-4" />
                  {c.name}
                </label>
              ))}
            </fieldset>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="font-campus-sans text-campus-sm font-medium text-campus-text">Claimed relationships not supported</legend>
              {linkedCapabilities.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 font-campus-sans text-campus-sm text-campus-text">
                  <input
                    type="checkbox"
                    checked={unsupportedCapabilityIds.includes(c.id)}
                    onChange={() => toggle(unsupportedCapabilityIds, setUnsupportedCapabilityIds, c.id)}
                    className="h-4 w-4"
                  />
                  {c.name}
                </label>
              ))}
            </fieldset>
          </div>
        )}

        <fieldset className="flex flex-col gap-1.5">
          <legend className="font-campus-sans text-campus-sm font-medium text-campus-text">Limitations (optional)</legend>
          <div className="flex flex-wrap gap-3">
            {LIMITATION_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-1.5 font-campus-sans text-campus-sm text-campus-text">
                <input type="checkbox" checked={limitations.includes(tag)} onChange={() => toggle(limitations, (v) => setLimitations(v as EvidenceLimitationTag[]), tag)} className="h-4 w-4" />
                {LIMITATION_TAG_LABELS[tag]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="provenance-concern" className="font-campus-sans text-campus-sm font-medium text-campus-text">
            Provenance concern (optional)
          </label>
          <select
            id="provenance-concern"
            value={provenanceConcern}
            onChange={(e) => setProvenanceConcern(e.target.value as ProvenanceConcernType | '')}
            className="rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text"
          >
            <option value="">None</option>
            {PROVENANCE_CONCERNS.map((concern) => (
              <option key={concern} value={concern}>
                {PROVENANCE_CONCERN_LABELS[concern]}
              </option>
            ))}
          </select>
        </div>

        <ImpactPreviewPanel preview={preview} />

        {error && <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">{error}</p>}

        <Button type="submit">Review decision</Button>
      </form>
    </Panel>
  )
}

function ImpactPreviewPanel({ preview }: { preview: ReviewImpactPreview }) {
  return (
    <div className="rounded-campus-md border border-dashed border-campus-border p-4">
      <p className="mb-2 flex items-center gap-1.5 font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">
        <Info size={12} aria-hidden="true" /> Expected system effect (impact preview — not guaranteed)
      </p>
      {preview.likelyAffectedCapabilities.length === 0 ? (
        <p className="font-campus-sans text-campus-sm text-campus-muted">No linked capabilities to project.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {preview.likelyAffectedCapabilities.map((c) => (
            <li key={c.capabilityId} className="font-campus-sans text-campus-sm text-campus-text">
              <Badge tone={c.likelyDirection === 'increase' ? 'green' : c.likelyDirection === 'decrease' ? 'red' : 'neutral'} className="mr-1.5">
                {c.likelyDirection === 'increase' ? '↑' : c.likelyDirection === 'decrease' ? '↓' : '—'}
              </Badge>
              {c.rationale}
            </li>
          ))}
        </ul>
      )}
      {preview.newlyEligibleForPassportCapabilityNames.length > 0 && (
        <p className="mt-2 font-campus-sans text-campus-xs text-campus-muted">
          May become eligible for Syrka Career Passport inclusion: {preview.newlyEligibleForPassportCapabilityNames.join(', ')}.
        </p>
      )}
      {preview.odysseyMilestonesLikelyUnblocked.length > 0 && (
        <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">Odyssey milestones likely unblocked: {preview.odysseyMilestonesLikelyUnblocked.join(', ')}.</p>
      )}
      {preview.remainingEvidenceGaps.length > 0 && (
        <ul className="mt-1 list-disc pl-4 font-campus-sans text-campus-xs text-campus-muted">
          {preview.remainingEvidenceGaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
