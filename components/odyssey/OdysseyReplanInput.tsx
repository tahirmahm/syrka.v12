'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import type { OdysseyGenerationApiResponse } from './odyssey-client-types'

const EXAMPLE_PROMPTS = [
  'Reduce the workload this semester.',
  'I already have strong Python Evidence.',
  'Give me an alternative that does not require advanced mathematics.',
]

export interface OdysseyReplanInputProps {
  onResult: (result: OdysseyGenerationApiResponse) => void
  onClose: () => void
}

/**
 * Plain-language replanning. Not a general chat surface — one instruction
 * per submission, always producing a new plan version through the same
 * validated pipeline as initial generation.
 */
export function OdysseyReplanInput({ onResult, onClose }: OdysseyReplanInputProps) {
  const router = useRouter()
  const [adjustmentInstruction, setAdjustmentInstruction] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!adjustmentInstruction.trim()) return
    setPending(true)
    setError(undefined)
    try {
      const response = await fetch('/api/odyssey/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustmentInstruction }),
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
    <Panel className="flex flex-col gap-3" role="form" aria-label="Replan Odyssey">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="adjustment-instruction" className="font-campus-sans text-campus-sm font-medium text-campus-text">
          What would you like to change?
        </label>
        <textarea
          id="adjustment-instruction"
          required
          rows={2}
          value={adjustmentInstruction}
          onChange={(e) => setAdjustmentInstruction(e.target.value)}
          placeholder={EXAMPLE_PROMPTS[0]}
          className="rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        />
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setAdjustmentInstruction(prompt)}
              className="rounded-campus-sm border border-campus-border px-2 py-1 font-campus-sans text-campus-xs text-campus-muted hover:bg-campus-surface-raised"
            >
              {prompt}
            </button>
          ))}
        </div>

        {error && <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">{error}</p>}

        <div className="flex items-center gap-2">
          <Button type="submit" loading={pending}>
            Replan
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  )
}
