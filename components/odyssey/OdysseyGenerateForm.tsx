'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { SyrkaIntelligenceState } from '@/components/intelligence/SyrkaIntelligenceState'
import type { OdysseyGenerationApiResponse } from './odyssey-client-types'

const WORKLOAD_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'standard', label: 'Standard' },
  { value: 'intensive', label: 'Intensive' },
] as const

/**
 * Odyssey product correction §7 — a Class X plan goal is a selected
 * intent, not a free-text job title. Kept on the wire as `destinationTitle`
 * (the underlying OdysseyGenerationRequest field) so the API/type layer
 * and career-pathway regression fixture are untouched.
 */
const PLAN_GOAL_OPTIONS = [
  'Complete current curriculum',
  'Strengthen a subject',
  'Strengthen a Capability',
  'Prepare for assessment',
  'Resolve learning gaps',
  'Explore post-Class-X directions',
]

const TIME_HORIZON_OPTIONS = ['Next session', 'This week', 'This month', 'This term', 'Class X completion']

const ACTION_TYPE_OPTIONS = [
  { value: 'lessons', label: 'Lessons' },
  { value: 'revision', label: 'Revision' },
  { value: 'practice', label: 'Practice' },
  { value: 'transfer_task', label: 'Transfer tasks' },
  { value: 'project', label: 'Projects' },
  { value: 'evidence_mission', label: 'Evidence missions' },
  { value: 'faculty_review', label: 'Faculty review' },
]

export interface OdysseyGenerateFormProps {
  defaultDestinationTitle: string
  onResult: (result: OdysseyGenerationApiResponse) => void
  onClose: () => void
}

/**
 * The initial-generation and change-destination experience. Submits to the
 * server-only /api/odyssey/generate route — this component never talks to
 * DeepSeek directly and never sees a raw provider response, only the
 * validated OdysseyGenerationResult.
 */
export function OdysseyGenerateForm({ defaultDestinationTitle, onResult, onClose }: OdysseyGenerateFormProps) {
  const router = useRouter()
  const isKnownPlanGoal = PLAN_GOAL_OPTIONS.includes(defaultDestinationTitle)
  const [destinationTitle, setDestinationTitle] = useState(isKnownPlanGoal ? defaultDestinationTitle : PLAN_GOAL_OPTIONS[0])
  const [destinationDescription, setDestinationDescription] = useState('')
  const [workloadPreference, setWorkloadPreference] = useState<(typeof WORKLOAD_OPTIONS)[number]['value']>('standard')
  const [timeHorizon, setTimeHorizon] = useState<string>(TIME_HORIZON_OPTIONS[1])
  const [preferredActionTypes, setPreferredActionTypes] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()

  function toggleActionType(value: string) {
    setPreferredActionTypes((current) => (current.includes(value) ? current.filter((v) => v !== value) : [...current, value]))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(undefined)
    try {
      const response = await fetch('/api/odyssey/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationTitle, destinationDescription, workloadPreference, timeHorizon, preferredActionTypes }),
      })
      const result: OdysseyGenerationApiResponse = await response.json()
      onResult(result)
      if (result.status === 'success') {
        onClose()
        router.refresh()
      }
    } catch {
      setError('The request could not be sent. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Panel className="flex flex-col gap-4" role="form" aria-label="Adjust your academic plan">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-title" className="font-campus-sans text-campus-sm font-medium text-campus-text">
            Plan goal
          </label>
          <select
            id="destination-title"
            required
            value={destinationTitle}
            onChange={(e) => setDestinationTitle(e.target.value)}
            className="rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          >
            {PLAN_GOAL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-description" className="font-campus-sans text-campus-sm font-medium text-campus-text">
            Notes <span className="font-normal text-campus-muted">(optional)</span>
          </label>
          <textarea
            id="destination-description"
            value={destinationDescription}
            onChange={(e) => setDestinationDescription(e.target.value)}
            rows={2}
            className="rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="workload-preference" className="font-campus-sans text-campus-sm font-medium text-campus-text">
              Workload preference
            </label>
            <select
              id="workload-preference"
              value={workloadPreference}
              onChange={(e) => setWorkloadPreference(e.target.value as typeof workloadPreference)}
              className="rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
            >
              {WORKLOAD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="time-horizon" className="font-campus-sans text-campus-sm font-medium text-campus-text">
              Time horizon
            </label>
            <select
              id="time-horizon"
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
              className="rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
            >
              {TIME_HORIZON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="font-campus-sans text-campus-sm font-medium text-campus-text">Preferred learning actions (optional)</legend>
          <div className="flex flex-wrap gap-3">
            {ACTION_TYPE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-1.5 font-campus-sans text-campus-sm text-campus-text">
                <input
                  type="checkbox"
                  checked={preferredActionTypes.includes(option.value)}
                  onChange={() => toggleActionType(option.value)}
                  className="h-4 w-4 rounded border-campus-border"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={pending}>
            Update academic path
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          {pending && <SyrkaIntelligenceState state="shaping" label="Rebuilding your academic path" />}
        </div>
      </form>
    </Panel>
  )
}
