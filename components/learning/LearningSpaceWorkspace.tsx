'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { List, X, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Panel } from '@/components/ui/Panel'
import { ContextualInspector } from '@/components/campus/ContextualInspector'
import { LIFECYCLE_STATE_LABELS, LIFECYCLE_STATE_TONES, QUALITY_STATE_LABELS, QUALITY_STATE_TONES, WARNING_SEVERITY_TONES, SOURCE_TYPE_LABELS, SOURCE_RIGHTS_LABELS } from '@/lib/constants/learning-ingestion'
import type {
  ExtractionWarning,
  LearningDocument,
  LearningDocumentVersion,
  LearningPage,
  LearningSpace,
  LearningSpaceVersion,
  LearningStructureProposal,
  SourceReference,
  TeacherCorrection,
} from '@/lib/campus-types'
import { CorrectionForm } from './CorrectionForm'

type Selection = { kind: 'page'; id: string } | { kind: 'chapter'; id: string } | { kind: 'section'; id: string } | { kind: 'warning'; id: string } | undefined

export interface LearningSpaceWorkspaceProps {
  space: LearningSpace
  spaceVersion?: LearningSpaceVersion
  document?: LearningDocument
  documentVersion?: LearningDocumentVersion
  pages: LearningPage[]
  warnings: ExtractionWarning[]
  sourceReferences: SourceReference[]
  corrections: TeacherCorrection[]
  proposal?: LearningStructureProposal
}

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, { method: 'POST', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  return res.json()
}

async function patchCorrection(spaceId: string, correctionId: string, action: 'accept' | 'revert') {
  const res = await fetch(`/api/learning/spaces/${spaceId}/corrections/${correctionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  const data = await res.json()
  return { ok: data.ok, message: data.ok ? `Correction ${action === 'accept' ? 'accepted' : 'reverted'}.` : data.message }
}

/**
 * The three-pane authoring workspace: document structure navigator,
 * source + curriculum canvas, and a review inspector — not a generic card
 * page, and not a graph (no XYFlow; the course tree is hierarchical
 * navigation). Reuses the Stage 1 Campus shell (applied by
 * app/faculty/layout.tsx) and the shared ContextualInspector primitive for
 * its mobile bottom-sheet behaviour.
 */
export function LearningSpaceWorkspace({ space, spaceVersion, document, documentVersion, pages, warnings, sourceReferences, corrections, proposal }: LearningSpaceWorkspaceProps) {
  const router = useRouter()
  const [selection, setSelection] = useState<Selection>(undefined)
  const [isMobile, setIsMobile] = useState(false)
  const [navigatorOpen, setNavigatorOpen] = useState(false)
  const [pending, setPending] = useState<string | undefined>()
  const [statusMessage, setStatusMessage] = useState<{ tone: 'success' | 'error'; text: string } | undefined>()

  useEffect(() => {
    function checkViewport() {
      setIsMobile(window.innerWidth < 1024)
    }
    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  const pagesById = useMemo(() => new Map(pages.map((p) => [p.id, p])), [pages])
  const sourceReferencesById = useMemo(() => new Map(sourceReferences.map((r) => [r.id, r])), [sourceReferences])
  const correctionsByPage = useMemo(() => {
    const map = new Map<string, TeacherCorrection[]>()
    corrections.forEach((c) => {
      if (!c.pageId) return
      const list = map.get(c.pageId) ?? []
      list.push(c)
      map.set(c.pageId, list)
    })
    return map
  }, [corrections])

  const unresolvedWarnings = warnings.filter((w) => !w.resolved)
  const unresolvedHighSeverity = unresolvedWarnings.filter((w) => w.severity === 'high')

  function jumpToPageForReference(sourceReferenceId?: string) {
    if (!sourceReferenceId) return
    const ref = sourceReferencesById.get(sourceReferenceId)
    if (ref) {
      setSelection({ kind: 'page', id: ref.pageId })
      setNavigatorOpen(false)
    }
  }

  async function runAction(key: string, fn: () => Promise<{ ok: boolean; message?: string }>) {
    setPending(key)
    setStatusMessage(undefined)
    try {
      const result = await fn()
      setStatusMessage({ tone: result.ok ? 'success' : 'error', text: result.message ?? (result.ok ? 'Done.' : 'Action failed.') })
      if (result.ok) router.refresh()
    } catch {
      setStatusMessage({ tone: 'error', text: 'Something went wrong reaching the server.' })
    } finally {
      setPending(undefined)
    }
  }

  const navigator = (
    <nav aria-label="Document structure navigator" className="flex h-full flex-col gap-4 overflow-y-auto">
      <div>
        <h2 className="mb-2 font-campus-mono text-campus-xs font-medium uppercase tracking-wide text-campus-muted">Pages ({pages.length})</h2>
        <ul className="flex flex-col gap-1">
          {pages.map((page) => (
            <li key={page.id}>
              <button
                type="button"
                onClick={() => {
                  setSelection({ kind: 'page', id: page.id })
                  setNavigatorOpen(false)
                }}
                aria-current={selection?.kind === 'page' && selection.id === page.id ? 'true' : undefined}
                className={`flex w-full items-center justify-between gap-2 rounded-campus-sm px-2 py-1.5 text-left font-campus-sans text-campus-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
                  selection?.kind === 'page' && selection.id === page.id ? 'bg-campus-surface-raised font-medium text-campus-text' : 'text-campus-muted hover:bg-campus-surface-raised hover:text-campus-text'
                }`}
              >
                <span>Page {page.pageNumber}</span>
                {page.qualityState && page.qualityState !== 'reliable' && <Badge tone={QUALITY_STATE_TONES[page.qualityState]}>{QUALITY_STATE_LABELS[page.qualityState]}</Badge>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {proposal && (
        <>
          <div>
            <h2 className="mb-2 font-campus-mono text-campus-xs font-medium uppercase tracking-wide text-campus-muted">Chapters ({proposal.chapters.length})</h2>
            <ul className="flex flex-col gap-1">
              {proposal.chapters.map((chapter) => (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelection({ kind: 'chapter', id: chapter.id })
                      setNavigatorOpen(false)
                    }}
                    aria-current={selection?.kind === 'chapter' && selection.id === chapter.id ? 'true' : undefined}
                    className={`w-full truncate rounded-campus-sm px-2 py-1.5 text-left font-campus-sans text-campus-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
                      selection?.kind === 'chapter' && selection.id === chapter.id ? 'bg-campus-surface-raised font-medium text-campus-text' : 'text-campus-muted hover:bg-campus-surface-raised hover:text-campus-text'
                    }`}
                  >
                    {chapter.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-2 font-campus-mono text-campus-xs font-medium uppercase tracking-wide text-campus-muted">Sections ({proposal.sections.length})</h2>
            <ul className="flex flex-col gap-1">
              {proposal.sections.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelection({ kind: 'section', id: section.id })
                      setNavigatorOpen(false)
                    }}
                    aria-current={selection?.kind === 'section' && selection.id === section.id ? 'true' : undefined}
                    className={`w-full truncate rounded-campus-sm px-2 py-1.5 text-left font-campus-sans text-campus-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
                      selection?.kind === 'section' && selection.id === section.id ? 'bg-campus-surface-raised font-medium text-campus-text' : 'text-campus-muted hover:bg-campus-surface-raised hover:text-campus-text'
                    }`}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 font-campus-mono text-campus-xs font-medium uppercase tracking-wide text-campus-muted">
          Warnings ({unresolvedWarnings.length} unresolved)
        </h2>
        <ul className="flex flex-col gap-1">
          {warnings.map((warning) => (
            <li key={warning.id}>
              <button
                type="button"
                onClick={() => {
                  setSelection({ kind: 'warning', id: warning.id })
                  setNavigatorOpen(false)
                }}
                aria-current={selection?.kind === 'warning' && selection.id === warning.id ? 'true' : undefined}
                className={`flex w-full items-center justify-between gap-2 rounded-campus-sm px-2 py-1.5 text-left font-campus-sans text-campus-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
                  selection?.kind === 'warning' && selection.id === warning.id ? 'bg-campus-surface-raised font-medium text-campus-text' : 'text-campus-muted hover:bg-campus-surface-raised hover:text-campus-text'
                }`}
              >
                <span className="truncate">{warning.description}</span>
                <Badge tone={warning.resolved ? 'green' : WARNING_SEVERITY_TONES[warning.severity]}>{warning.resolved ? 'Resolved' : warning.severity}</Badge>
              </button>
            </li>
          ))}
          {warnings.length === 0 && <li className="px-2 py-1.5 font-campus-sans text-campus-sm text-campus-muted">No extraction warnings.</li>}
        </ul>
      </div>
    </nav>
  )

  const canvas = (() => {
    if (selection?.kind === 'page') {
      const page = pagesById.get(selection.id)
      if (!page) return null
      const pageCorrections = correctionsByPage.get(page.id) ?? []
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-campus-sans text-campus-lg font-medium text-campus-text">Page {page.pageNumber}</h2>
            {page.qualityState && <Badge tone={QUALITY_STATE_TONES[page.qualityState]}>{QUALITY_STATE_LABELS[page.qualityState]}</Badge>}
          </div>
          <Panel className="p-4">
            <h3 className="mb-2 font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Extracted text</h3>
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap font-campus-sans text-campus-sm text-campus-text">{page.extractedText || '(no extractable text)'}</pre>
          </Panel>
          <div>
            <h3 className="mb-2 font-campus-sans text-campus-sm font-medium text-campus-text">Corrections ({pageCorrections.length})</h3>
            {pageCorrections.length === 0 ? (
              <p className="font-campus-sans text-campus-sm text-campus-muted">No corrections on this page yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {pageCorrections.map((correction) => (
                  <li key={correction.id}>
                    <Panel className="flex flex-col gap-1.5 p-3">
                      <div className="flex items-center justify-between">
                        <Badge tone="neutral">{correction.targetType}</Badge>
                        <Badge tone={correction.reviewStatus === 'accepted' ? 'green' : correction.reviewStatus === 'reverted' ? 'neutral' : 'amber'}>{correction.reviewStatus ?? 'pending'}</Badge>
                      </div>
                      <p className="font-campus-sans text-campus-sm text-campus-text">{correction.changeSummary}</p>
                      <p className="font-campus-sans text-campus-xs text-campus-muted">Reason: {correction.reason}</p>
                      <div className="flex gap-2">
                        {correction.reviewStatus !== 'accepted' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={pending === `accept-${correction.id}`}
                            onClick={() => runAction(`accept-${correction.id}`, () => patchCorrection(space.id, correction.id, 'accept'))}
                          >
                            Accept
                          </Button>
                        )}
                        {correction.reviewStatus !== 'reverted' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={pending === `revert-${correction.id}`}
                            onClick={() => runAction(`revert-${correction.id}`, () => patchCorrection(space.id, correction.id, 'revert'))}
                          >
                            Revert
                          </Button>
                        )}
                      </div>
                    </Panel>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <CorrectionForm spaceId={space.id} page={page} onSubmitted={() => router.refresh()} />
        </div>
      )
    }

    if (selection?.kind === 'chapter' && proposal) {
      const chapter = proposal.chapters.find((c) => c.id === selection.id)
      if (!chapter) return null
      const sections = proposal.sections.filter((s) => s.chapterProposalId === chapter.id)
      return (
        <div className="flex flex-col gap-4">
          <h2 className="font-campus-sans text-campus-lg font-medium text-campus-text">{chapter.title}</h2>
          <Badge tone={chapter.confidence.band === 'high' ? 'green' : chapter.confidence.band === 'moderate' ? 'amber' : 'red'}>Structural confidence: {chapter.confidence.band}</Badge>
          <p className="font-campus-sans text-campus-sm text-campus-muted">{chapter.confidence.reason}</p>
          <Button size="sm" variant="secondary" onClick={() => jumpToPageForReference(chapter.sourceReferenceIds[0])}>
            View source page
          </Button>
          <div>
            <h3 className="mb-2 font-campus-sans text-campus-sm font-medium text-campus-text">Sections ({sections.length})</h3>
            <ul className="flex flex-col gap-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <button type="button" onClick={() => setSelection({ kind: 'section', id: section.id })} className="text-left font-campus-sans text-campus-sm text-campus-blue-600 underline-offset-2 hover:underline dark:text-campus-blue-dark">
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    }

    if (selection?.kind === 'section' && proposal) {
      const section = proposal.sections.find((s) => s.id === selection.id)
      if (!section) return null
      const concepts = proposal.concepts.filter((c) => c.sectionProposalId === section.id)
      const conceptIds = new Set(concepts.map((c) => c.id))
      const explanations = proposal.explanations.filter((e) => conceptIds.has(e.conceptProposalId))
      const questions = proposal.questions.filter((q) => conceptIds.has(q.conceptProposalId))
      const activities = proposal.activities.filter((a) => a.sectionProposalId === section.id)
      const equations = proposal.equations.filter((e) => e.sectionProposalId === section.id)
      return (
        <div className="flex flex-col gap-4">
          <h2 className="font-campus-sans text-campus-lg font-medium text-campus-text">{section.title}</h2>
          <Badge tone={section.confidence.band === 'high' ? 'green' : section.confidence.band === 'moderate' ? 'amber' : 'red'}>Structural confidence: {section.confidence.band}</Badge>
          <p className="font-campus-sans text-campus-sm text-campus-muted">{section.confidence.reason}</p>
          <Button size="sm" variant="secondary" onClick={() => jumpToPageForReference(section.sourceReferenceIds[0])}>
            View source page
          </Button>

          {concepts.length > 0 && (
            <section aria-labelledby="section-concepts-heading">
              <h3 id="section-concepts-heading" className="mb-2 font-campus-sans text-campus-sm font-medium text-campus-text">
                Proposed concepts
              </h3>
              <ul className="flex flex-col gap-2">
                {concepts.map((concept) => (
                  <li key={concept.id}>
                    <Panel className="p-3">
                      <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{concept.title}</p>
                      <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">{concept.description}</p>
                    </Panel>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {explanations.length > 0 && (
            <section aria-labelledby="section-explanations-heading">
              <h3 id="section-explanations-heading" className="mb-2 font-campus-sans text-campus-sm font-medium text-campus-text">
                Proposed explanations
              </h3>
              <ul className="flex flex-col gap-2">
                {explanations.map((explanation) => (
                  <li key={explanation.id}>
                    <Panel className="p-3">
                      <p className="font-campus-sans text-campus-sm text-campus-text">{explanation.body}</p>
                    </Panel>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {equations.length > 0 && (
            <section aria-labelledby="section-equations-heading">
              <h3 id="section-equations-heading" className="mb-2 font-campus-sans text-campus-sm font-medium text-campus-text">
                Proposed equations
              </h3>
              <ul className="flex flex-col gap-2">
                {equations.map((equation) => (
                  <li key={equation.id}>
                    <Panel className="p-3">
                      <code className="font-campus-mono text-campus-sm text-campus-text">{equation.expression}</code>
                    </Panel>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {activities.length > 0 && (
            <section aria-labelledby="section-activities-heading">
              <h3 id="section-activities-heading" className="mb-2 font-campus-sans text-campus-sm font-medium text-campus-text">
                Proposed activities
              </h3>
              <ul className="flex flex-col gap-2">
                {activities.map((activity) => (
                  <li key={activity.id}>
                    <Panel className="p-3">
                      <p className="font-campus-sans text-campus-sm text-campus-text">{activity.instructions}</p>
                    </Panel>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {questions.length > 0 && (
            <section aria-labelledby="section-questions-heading">
              <h3 id="section-questions-heading" className="mb-2 font-campus-sans text-campus-sm font-medium text-campus-text">
                Proposed questions
              </h3>
              <ul className="flex flex-col gap-2">
                {questions.map((question) => (
                  <li key={question.id}>
                    <Panel className="p-3">
                      <p className="font-campus-sans text-campus-sm text-campus-text">{question.prompt}</p>
                    </Panel>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )
    }

    if (selection?.kind === 'warning') {
      const warning = warnings.find((w) => w.id === selection.id)
      if (!warning) return null
      const page = pagesById.get(warning.pageId)
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <WarningCircle size={20} className="text-campus-amber-600 dark:text-campus-amber-dark" aria-hidden="true" />
            <h2 className="font-campus-sans text-campus-lg font-medium text-campus-text">Extraction warning</h2>
          </div>
          <Badge tone={warning.resolved ? 'green' : WARNING_SEVERITY_TONES[warning.severity]}>{warning.resolved ? 'Resolved' : `${warning.severity} severity`}</Badge>
          <p className="font-campus-sans text-campus-sm text-campus-text">{warning.description}</p>
          {page && (
            <Button size="sm" variant="secondary" onClick={() => setSelection({ kind: 'page', id: page.id })}>
              Go to page {page.pageNumber}
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-4">
        <h2 className="font-campus-sans text-campus-lg font-medium text-campus-text">{document?.title ?? 'Untitled document'}</h2>
        <dl className="grid grid-cols-2 gap-4 text-campus-sm">
          <div>
            <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Source label</dt>
            <dd className="mt-0.5 text-campus-text">{document?.sourceLabel}</dd>
          </div>
          <div>
            <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Source type</dt>
            <dd className="mt-0.5 text-campus-text">{document?.sourceType ? SOURCE_TYPE_LABELS[document.sourceType] : '—'}</dd>
          </div>
          <div>
            <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Source-rights declaration</dt>
            <dd className="mt-0.5 text-campus-text">{document?.sourceRightsDeclaration ? SOURCE_RIGHTS_LABELS[document.sourceRightsDeclaration] : '—'}</dd>
          </div>
          <div>
            <dt className="font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Pages extracted</dt>
            <dd className="mt-0.5 text-campus-text">{pages.length}</dd>
          </div>
        </dl>
        {!proposal && (
          <p className="font-campus-sans text-campus-sm text-campus-muted">
            No structure proposal has been generated yet. Use &quot;Generate structure proposal&quot; in the review panel to produce a deterministic, rule-based starting point for review — it is not published curriculum until you approve it.
          </p>
        )}
      </div>
    )
  })()

  const governancePanel = (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-1 font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Version status</h3>
        <Badge tone={LIFECYCLE_STATE_TONES[space.lifecycleState]}>{LIFECYCLE_STATE_LABELS[space.lifecycleState]}</Badge>
        {spaceVersion && <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">Version {spaceVersion.version}</p>}
      </div>

      {statusMessage && (
        <p role="status" className={`rounded-campus-sm border p-2 font-campus-sans text-campus-xs ${statusMessage.tone === 'success' ? 'border-campus-green-600 text-campus-green-600 dark:border-campus-green-dark dark:text-campus-green-dark' : 'border-campus-red-600 text-campus-red-600 dark:border-campus-red-dark dark:text-campus-red-dark'}`}>
          {statusMessage.text}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {(space.lifecycleState === 'draft' || space.lifecycleState === 'corrections_required') && documentVersion && (
          <Button size="sm" loading={pending === 'propose'} onClick={() => runAction('propose', () => postJson(`/api/learning/spaces/${space.id}/propose`))}>
            Generate structure proposal
          </Button>
        )}
        {space.lifecycleState === 'structure_review' && (
          <Button size="sm" loading={pending === 'ready'} onClick={() => runAction('ready', () => postJson(`/api/learning/spaces/${space.id}/ready`))} disabled={unresolvedHighSeverity.length > 0}>
            Mark ready for approval
          </Button>
        )}
        {unresolvedHighSeverity.length > 0 && space.lifecycleState === 'structure_review' && (
          <p className="font-campus-sans text-campus-xs text-campus-red-600 dark:text-campus-red-dark">{unresolvedHighSeverity.length} unresolved high-severity warning(s) must be corrected first.</p>
        )}
        {space.lifecycleState === 'ready_for_approval' && (
          <Button size="sm" loading={pending === 'approve'} onClick={() => runAction('approve', () => postJson(`/api/learning/spaces/${space.id}/approve`, { note: 'Reviewed and approved via the authoring workspace.' }))}>
            Approve
          </Button>
        )}
        {space.lifecycleState !== 'withdrawn' && space.lifecycleState !== 'approved' && space.lifecycleState !== 'published' && space.lifecycleState !== 'superseded' && (
          <Button size="sm" variant="danger" loading={pending === 'withdraw'} onClick={() => runAction('withdraw', () => postJson(`/api/learning/spaces/${space.id}/withdraw`, { reason: 'Withdrawn from the authoring workspace.' }))}>
            Withdraw
          </Button>
        )}
      </div>
    </div>
  )

  const contextDetail =
    selection?.kind === 'page'
      ? (() => {
          const page = pagesById.get(selection.id)
          if (!page) return null
          return (
            <div>
              <h3 className="mb-1 font-campus-mono text-campus-xs uppercase tracking-wide text-campus-muted">Extraction quality</h3>
              <Badge tone={page.qualityState ? QUALITY_STATE_TONES[page.qualityState] : 'neutral'}>{page.qualityState ? QUALITY_STATE_LABELS[page.qualityState] : 'Unknown'}</Badge>
              <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">Extraction confidence: {page.extractionConfidence !== undefined ? `${Math.round(page.extractionConfidence * 100)}%` : '—'}</p>
              <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">Extraction confidence reflects how reliably the text was read — not whether its content is curriculum-correct.</p>
            </div>
          )
        })()
      : null

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <PageHeader
        title={space.title}
        subtitle={document ? `Source: ${document.title}` : 'No source document attached'}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Overview', href: '/faculty' }, { label: 'Learning Spaces', href: '/faculty/learning-spaces' }, { label: space.title }]} />}
        actions={
          isMobile ? (
            <Button size="sm" variant="secondary" icon={<List size={16} aria-hidden="true" />} onClick={() => setNavigatorOpen(true)} aria-expanded={navigatorOpen}>
              Structure
            </Button>
          ) : undefined
        }
      />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        {!isMobile && (
          <div className="min-h-0 overflow-y-auto rounded-campus-md border border-campus-border bg-campus-surface p-4">{navigator}</div>
        )}

        <div className="min-h-0 overflow-y-auto rounded-campus-md border border-campus-border bg-campus-surface p-5">{canvas}</div>

        {!isMobile && (
          <div className="min-h-0 overflow-y-auto rounded-campus-md border border-campus-border bg-campus-surface p-4">
            <div className="flex flex-col gap-4">
              {governancePanel}
              {contextDetail && <div className="border-t border-campus-border pt-4">{contextDetail}</div>}
            </div>
          </div>
        )}
      </div>

      {isMobile && <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">{governancePanel}</div>}

      {isMobile && navigatorOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Document structure navigator">
          <div className="w-full max-w-xs overflow-y-auto bg-campus-surface p-4" style={{ height: '100%' }}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-campus-sans text-campus-base font-medium text-campus-text">Structure</h2>
              <button type="button" onClick={() => setNavigatorOpen(false)} aria-label="Close structure navigator" className="rounded-campus-sm p-1.5 text-campus-muted hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            {navigator}
          </div>
          <button type="button" className="flex-1 bg-black/40" aria-label="Close structure navigator" onClick={() => setNavigatorOpen(false)} />
        </div>
      )}

      {isMobile && selection && contextDetail && (
        <ContextualInspector eyebrow="Review" title="Detail" onClose={() => setSelection(undefined)} isMobile>
          {contextDetail}
        </ContextualInspector>
      )}
    </div>
  )
}
