'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { InstitutionalInterventionType } from '@/lib/campus-types'
import { INSTITUTIONAL_INTERVENTION_TYPE_LABELS } from '@/lib/constants/university'

const INTERVENTION_TYPES = Object.keys(INSTITUTIONAL_INTERVENTION_TYPE_LABELS) as InstitutionalInterventionType[]

export interface InstitutionalInterventionFormOptions {
  departments: { id: string; name: string }[]
  programmes: { id: string; name: string }[]
  cohorts: { id: string; name: string }[]
  capabilities: { id: string; name: string }[]
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function InterventionForm({ departments, programmes, cohorts, capabilities }: InstitutionalInterventionFormOptions) {
  const router = useRouter()
  const [type, setType] = useState<InstitutionalInterventionType>('central_review_capacity_programme')
  const [title, setTitle] = useState('')
  const [rationale, setRationale] = useState('')
  const [expectedEffect, setExpectedEffect] = useState('')
  const [evidenceRequiredToEvaluate, setEvidenceRequiredToEvaluate] = useState('')
  const [limitations, setLimitations] = useState('')
  const [reviewDate, setReviewDate] = useState('')
  const [affectedDepartmentIds, setAffectedDepartmentIds] = useState<string[]>([])
  const [affectedProgrammeIds, setAffectedProgrammeIds] = useState<string[]>([])
  const [affectedCohortIds, setAffectedCohortIds] = useState<string[]>([])
  const [affectedCapabilityIds, setAffectedCapabilityIds] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const [result, setResult] = useState<{ message: string }>()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !rationale.trim() || !expectedEffect.trim() || !reviewDate) {
      setError('Title, rationale, projected effect, and a review date are all required.')
      return
    }
    setPending(true)
    setError(undefined)
    try {
      const response = await fetch('/api/university/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          rationale,
          expectedEffect,
          evidenceRequiredToEvaluate,
          limitations,
          reviewDate,
          affectedDepartmentIds,
          affectedProgrammeIds,
          affectedCohortIds,
          affectedCapabilityIds,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'The intervention could not be created.')
        return
      }
      setResult({ message: data.message })
      router.refresh()
    } catch {
      setError('The request could not be sent. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  if (result) {
    return (
      <Panel className="flex flex-col gap-2 border-campus-green-600 dark:border-campus-green-dark">
        <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Institutional intervention created</p>
        <p className="font-campus-sans text-campus-sm text-campus-text">{result.message}</p>
        <Button variant="secondary" size="sm" onClick={() => setResult(undefined)} className="mt-2 w-fit">
          Create another
        </Button>
      </Panel>
    )
  }

  return (
    <Panel>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="ii-type" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            Intervention type
          </label>
          <select
            id="ii-type"
            value={type}
            onChange={(e) => setType(e.target.value as InstitutionalInterventionType)}
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          >
            {INTERVENTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {INSTITUTIONAL_INTERVENTION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ii-title" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            Title
          </label>
          <input
            id="ii-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
        </div>

        <div>
          <label htmlFor="ii-rationale" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            Rationale
          </label>
          <textarea
            id="ii-rationale"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={2}
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
        </div>

        <fieldset>
          <legend className="mb-1 font-campus-sans text-campus-sm font-medium text-campus-text">Affected departments</legend>
          <div className="flex flex-wrap gap-1.5">
            {departments.map((d) => (
              <button key={d.id} type="button" onClick={() => setAffectedDepartmentIds(toggle(affectedDepartmentIds, d.id))} aria-pressed={affectedDepartmentIds.includes(d.id)}>
                <Badge tone={affectedDepartmentIds.includes(d.id) ? 'blue' : 'neutral'}>{d.name}</Badge>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 font-campus-sans text-campus-sm font-medium text-campus-text">Affected programmes</legend>
          <div className="flex flex-wrap gap-1.5">
            {programmes.map((p) => (
              <button key={p.id} type="button" onClick={() => setAffectedProgrammeIds(toggle(affectedProgrammeIds, p.id))} aria-pressed={affectedProgrammeIds.includes(p.id)}>
                <Badge tone={affectedProgrammeIds.includes(p.id) ? 'blue' : 'neutral'}>{p.name}</Badge>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 font-campus-sans text-campus-sm font-medium text-campus-text">Affected cohorts</legend>
          <div className="flex flex-wrap gap-1.5">
            {cohorts.map((c) => (
              <button key={c.id} type="button" onClick={() => setAffectedCohortIds(toggle(affectedCohortIds, c.id))} aria-pressed={affectedCohortIds.includes(c.id)}>
                <Badge tone={affectedCohortIds.includes(c.id) ? 'blue' : 'neutral'}>{c.name}</Badge>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 font-campus-sans text-campus-sm font-medium text-campus-text">Affected Capability domains</legend>
          <div className="flex flex-wrap gap-1.5">
            {capabilities.map((c) => (
              <button key={c.id} type="button" onClick={() => setAffectedCapabilityIds(toggle(affectedCapabilityIds, c.id))} aria-pressed={affectedCapabilityIds.includes(c.id)}>
                <Badge tone={affectedCapabilityIds.includes(c.id) ? 'blue' : 'neutral'}>{c.name}</Badge>
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="ii-effect" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            Expected effect <span className="font-campus-mono text-campus-xs text-campus-muted">(always a projection, never a guarantee)</span>
          </label>
          <textarea
            id="ii-effect"
            value={expectedEffect}
            onChange={(e) => setExpectedEffect(e.target.value)}
            rows={2}
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
        </div>

        <div>
          <label htmlFor="ii-evidence-needed" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            Evidence required to evaluate success
          </label>
          <textarea
            id="ii-evidence-needed"
            value={evidenceRequiredToEvaluate}
            onChange={(e) => setEvidenceRequiredToEvaluate(e.target.value)}
            rows={2}
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
        </div>

        <div>
          <label htmlFor="ii-limitations" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            Limitations
          </label>
          <textarea
            id="ii-limitations"
            value={limitations}
            onChange={(e) => setLimitations(e.target.value)}
            rows={2}
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
        </div>

        <div>
          <label htmlFor="ii-review-date" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            Review date
          </label>
          <input
            id="ii-review-date"
            type="date"
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 sm:w-auto"
          />
        </div>

        {error && <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">{error}</p>}

        <Button type="submit" loading={pending} className="w-fit">
          Create institutional intervention
        </Button>
      </form>
    </Panel>
  )
}
