'use client'

import { useId, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { UploadSimple } from '@phosphor-icons/react/dist/ssr'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import type { DocumentSourceType, SourceRightsDeclaration } from '@/lib/campus-types'
import { SOURCE_TYPE_LABELS, SOURCE_RIGHTS_LABELS } from '@/lib/constants/learning-ingestion'

const SOURCE_TYPES = Object.keys(SOURCE_TYPE_LABELS) as DocumentSourceType[]
const SOURCE_RIGHTS = Object.keys(SOURCE_RIGHTS_LABELS) as SourceRightsDeclaration[]

/** Server-only intake — this client component only ever talks to /api/learning/documents; it never imports PDF-parsing code itself. */
export function NewLearningSpaceForm() {
  const router = useRouter()
  const formId = useId()
  const [title, setTitle] = useState('')
  const [sourceLabel, setSourceLabel] = useState('')
  const [sourceType, setSourceType] = useState<DocumentSourceType>('textbook')
  const [sourceRights, setSourceRights] = useState<SourceRightsDeclaration>('development_demonstration_only')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [notice, setNotice] = useState<string | undefined>()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Choose a PDF file to upload.')
      return
    }
    setSubmitting(true)
    setError(undefined)
    setNotice(undefined)

    try {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('sourceLabel', sourceLabel || file.name)
      formData.set('sourceType', sourceType)
      formData.set('sourceRightsDeclaration', sourceRights)

      const intakeRes = await fetch('/api/learning/documents', { method: 'POST', body: formData })
      const intake = await intakeRes.json()
      if (!intake.ok) {
        setError(intake.message ?? 'Upload failed.')
        setSubmitting(false)
        return
      }
      if (intake.reason === 'some_pages_require_ocr') {
        setNotice(intake.message)
      }

      const spaceRes = await fetch('/api/learning/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || intake.document.title,
          curriculumId: `curriculum-adhoc-${intake.document.id}`,
          documentVersionId: intake.documentVersion.id,
        }),
      })
      const spaceResult = await spaceRes.json()
      if (!spaceResult.ok) {
        setError(spaceResult.message ?? 'Could not create the Learning Space.')
        setSubmitting(false)
        return
      }

      router.push(`/faculty/learning-spaces/${spaceResult.space.id}/review`)
    } catch {
      setError('Something went wrong reaching the server. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <Panel>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-campus-sm border border-campus-red-600 p-3 font-campus-sans text-campus-sm text-campus-red-600 dark:border-campus-red-dark dark:text-campus-red-dark">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-campus-sm border border-campus-amber-600 p-3 font-campus-sans text-campus-sm text-campus-amber-600 dark:border-campus-amber-dark dark:text-campus-amber-dark">
            {notice}
          </p>
        )}

        <div>
          <label htmlFor={`${formId}-title`} className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            Learning Space title
          </label>
          <input
            id={`${formId}-title`}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Class X Science — Chapter 1"
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
        </div>

        <div>
          <label htmlFor={`${formId}-file`} className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            PDF document
          </label>
          <input
            id={`${formId}-file`}
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-campus-sm border border-dashed border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text file:mr-3 file:rounded-campus-sm file:border-0 file:bg-campus-surface-raised file:px-3 file:py-1.5 file:font-campus-sans file:text-campus-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
          <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">Native PDF text extraction only — scanned/encrypted PDFs are not supported yet.</p>
        </div>

        <div>
          <label htmlFor={`${formId}-source-label`} className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
            Source label
          </label>
          <input
            id={`${formId}-source-label`}
            type="text"
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
            placeholder="e.g. NCERT Class X Science"
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${formId}-source-type`} className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
              Source type
            </label>
            <select
              id={`${formId}-source-type`}
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as DocumentSourceType)}
              className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
            >
              {SOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {SOURCE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${formId}-source-rights`} className="mb-1 block font-campus-sans text-campus-sm font-medium text-campus-text">
              Source-rights declaration
            </label>
            <select
              id={`${formId}-source-rights`}
              value={sourceRights}
              onChange={(e) => setSourceRights(e.target.value as SourceRightsDeclaration)}
              className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
            >
              {SOURCE_RIGHTS.map((right) => (
                <option key={right} value={right}>
                  {SOURCE_RIGHTS_LABELS[right]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="-mt-2 font-campus-sans text-campus-xs text-campus-muted">
          This declares who owns or has licensed this material — it is an audit field, not automatic legal clearance.
        </p>

        <Button type="submit" loading={submitting} icon={<UploadSimple size={16} aria-hidden="true" />}>
          Upload and extract
        </Button>
      </form>
    </Panel>
  )
}
