'use client'

import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import type { LearningPage, TeacherCorrection } from '@/lib/campus-types'

const TARGET_TYPES: TeacherCorrection['targetType'][] = ['heading', 'paragraph', 'equation', 'caption', 'question', 'reading_order', 'missing_text', 'joined_text', 'figure', 'concept', 'page']

export interface CorrectionFormProps {
  spaceId: string
  page: LearningPage
  onSubmitted: () => void
}

/** Overlays a correction onto a page's extracted text — never mutates the original (Stage B §9). */
export function CorrectionForm({ spaceId, page, onSubmitted }: CorrectionFormProps) {
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [targetType, setTargetType] = useState<TeacherCorrection['targetType']>('paragraph')
  const [correctedValue, setCorrectedValue] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!correctedValue.trim() || !reason.trim()) {
      setError('Corrected value and reason are both required.')
      return
    }
    setSubmitting(true)
    setError(undefined)
    try {
      const res = await fetch(`/api/learning/spaces/${spaceId}/corrections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId: page.id,
          pageId: page.id,
          originalValue: page.extractedText ?? '',
          correctedValue,
          reason,
          changeSummary: `Corrected ${targetType} on page ${page.pageNumber}.`,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.message ?? 'Could not save the correction.')
        setSubmitting(false)
        return
      }
      setCorrectedValue('')
      setReason('')
      setOpen(false)
      onSubmitted()
    } catch {
      setError('Something went wrong reaching the server.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Add correction
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-campus-md border border-campus-border p-4">
      <h3 className="font-campus-sans text-campus-sm font-medium text-campus-text">Add a correction to page {page.pageNumber}</h3>
      {error && (
        <p role="alert" className="font-campus-sans text-campus-xs text-campus-red-600 dark:text-campus-red-dark">
          {error}
        </p>
      )}
      <div>
        <label htmlFor={`${formId}-target`} className="mb-1 block font-campus-sans text-campus-xs font-medium text-campus-text">
          What is being corrected
        </label>
        <select
          id={`${formId}-target`}
          value={targetType}
          onChange={(e) => setTargetType(e.target.value as TeacherCorrection['targetType'])}
          className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-2 py-1.5 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        >
          {TARGET_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${formId}-corrected`} className="mb-1 block font-campus-sans text-campus-xs font-medium text-campus-text">
          Corrected value
        </label>
        <textarea
          id={`${formId}-corrected`}
          value={correctedValue}
          onChange={(e) => setCorrectedValue(e.target.value)}
          rows={3}
          className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-2 py-1.5 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        />
      </div>
      <div>
        <label htmlFor={`${formId}-reason`} className="mb-1 block font-campus-sans text-campus-xs font-medium text-campus-text">
          Reason
        </label>
        <input
          id={`${formId}-reason`}
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-2 py-1.5 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={submitting}>
          Save correction
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
