'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { InterventionType } from '@/lib/campus-types'
import { INTERVENTION_TYPE_LABELS } from '@/lib/constants/department'

const INTERVENTION_TYPES = Object.keys(INTERVENTION_TYPE_LABELS) as InterventionType[]

export interface InterventionFormOptions {
  programmes: { id: string; name: string }[]
  courses: { id: string; label: string }[]
  cohorts: { id: string; name: string }[]
  capabilities: { id: string; name: string }[]
}

export function InterventionForm({ programmes, courses, cohorts, capabilities }: InterventionFormOptions) {
  const router = useRouter()
  const [type, setType] = useState<InterventionType>('add_evidence_project')
  const [title, setTitle] = useState('')
  const [rationale, setRationale] = useState('')
  const [expectedEffect, setExpectedEffect] = useState('')
  const [evidenceRequiredToEvaluate, setEvidenceRequiredToEvaluate] = useState('')
  const [limitations, setLimitations] = useState('')
  const [reviewDate, setReviewDate] = useState('')
  const [programmeId, setProgrammeId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [cohortId, setCohortId] = useState('')
  const [capabilityIds, setCapabilityIds] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const [result, setResult] = useState<{ message: string }>()

  const toggleCapability = (id: string) => setCapabilityIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !rationale.trim() || !expectedEffect.trim() || !reviewDate) {
      setError('Title, rationale, projected effect, and a review date are all required.')
      return
    }
    setPending(true)
    setError(undefined)
    try {
      const response = await fetch('/api/department/interventions', {
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
          programmeId: programmeId || undefined,
          courseId: courseId || undefined,
          cohortId: cohortId || undefined,
          capabilityIds,
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
        <p className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Intervention created</p>
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
        <label htmlFor="intervention-type" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
          Intervention type
        </label>
        <select
          id="intervention-type"
          value={type}
          onChange={(e) => setType(e.target.value as InterventionType)}
          className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        >
          {INTERVENTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {INTERVENTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="intervention-title" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
          Title
        </label>
        <input
          id="intervention-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        />
      </div>

      <div>
        <label htmlFor="intervention-rationale" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
          Rationale
        </label>
        <textarea
          id="intervention-rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={2}
          className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="intervention-programme" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            Affected programme
          </label>
          <select
            id="intervention-programme"
            value={programmeId}
            onChange={(e) => setProgrammeId(e.target.value)}
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text"
          >
            <option value="">None</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="intervention-course" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            Affected course
          </label>
          <select
            id="intervention-course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text"
          >
            <option value="">None</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="intervention-cohort" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            Affected cohort
          </label>
          <select
            id="intervention-cohort"
            value={cohortId}
            onChange={(e) => setCohortId(e.target.value)}
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text"
          >
            <option value="">None</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="mb-1 font-campus-sans text-campus-sm font-medium text-campus-text">Affected Capability domains</legend>
        <div className="flex flex-wrap gap-1.5">
          {capabilities.map((c) => (
            <button key={c.id} type="button" onClick={() => toggleCapability(c.id)} aria-pressed={capabilityIds.includes(c.id)}>
              <Badge tone={capabilityIds.includes(c.id) ? 'blue' : 'neutral'}>{c.name}</Badge>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="intervention-effect" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
          Expected effect <span className="font-campus-mono text-campus-xs text-campus-muted">(always a projection, never a guarantee)</span>
        </label>
        <textarea
          id="intervention-effect"
          value={expectedEffect}
          onChange={(e) => setExpectedEffect(e.target.value)}
          rows={2}
          className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        />
      </div>

      <div>
        <label htmlFor="intervention-evidence-needed" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
          Evidence required to evaluate success
        </label>
        <textarea
          id="intervention-evidence-needed"
          value={evidenceRequiredToEvaluate}
          onChange={(e) => setEvidenceRequiredToEvaluate(e.target.value)}
          rows={2}
          className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        />
      </div>

      <div>
        <label htmlFor="intervention-limitations" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
          Limitations
        </label>
        <textarea
          id="intervention-limitations"
          value={limitations}
          onChange={(e) => setLimitations(e.target.value)}
          rows={2}
          className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        />
      </div>

      <div>
        <label htmlFor="intervention-review-date" className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
          Review date
        </label>
        <input
          id="intervention-review-date"
          type="date"
          value={reviewDate}
          onChange={(e) => setReviewDate(e.target.value)}
          className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 sm:w-auto"
        />
      </div>

      {error && <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">{error}</p>}

      <Button type="submit" loading={pending} className="w-fit">
        Create intervention
      </Button>
      </form>
    </Panel>
  )
}
