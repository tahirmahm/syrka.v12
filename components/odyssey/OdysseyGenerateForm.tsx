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

const ACTION_TYPE_OPTIONS = [
  { value: 'course', label: 'Courses' },
  { value: 'project', label: 'Projects' },
  { value: 'research', label: 'Research' },
  { value: 'internship', label: 'Internships' },
  { value: 'competition', label: 'Competitions' },
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
  const [destinationTitle, setDestinationTitle] = useState(defaultDestinationTitle)
  const [destinationDescription, setDestinationDescription] = useState('')
  const [workloadPreference, setWorkloadPreference] = useState<(typeof WORKLOAD_OPTIONS)[number]['value']>('standard')
  const [timeHorizon, setTimeHorizon] = useState('')
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
    <Panel className="flex flex-col gap-4" role="form" aria-label="Generate Odyssey">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-title" className="font-campus-sans text-campus-sm font-medium text-campus-text">
            Destination
          </label>
          <input
            id="destination-title"
            required
            value={destinationTitle}
            onChange={(e) => setDestinationTitle(e.target.value)}
            className="rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination-description" className="font-campus-sans text-campus-sm font-medium text-campus-text">
            Description <span className="font-normal text-campus-muted">(optional)</span>
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
              Time horizon <span className="font-normal text-campus-muted">(optional)</span>
            </label>
            <input
              id="time-horizon"
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
              placeholder="e.g. this academic year"
              className="rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
            />
          </div>
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="font-campus-sans text-campus-sm font-medium text-campus-text">Preferred opportunity types (optional)</legend>
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
            Generate Odyssey
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          {pending && <SyrkaIntelligenceState state="shaping" label="Generating your Odyssey" />}
        </div>
      </form>
    </Panel>
  )
}
