'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { SyrkaIntelligenceState } from '@/components/intelligence/SyrkaIntelligenceState'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import type { NcertConceptWorkbenchView } from '@/lib/utilities/ncert-curriculum-projection'
import { evaluateConceptResponse, type ConceptTutorSessionState } from '@/lib/services/learning/concept-tutor-engine'
import { ConceptTutorPanel } from './ConceptTutorPanel'
import { EconomicsCreditSimulator } from './visuals/EconomicsCreditSimulator'
import { FarmingClassificationInteractive } from './visuals/FarmingClassificationInteractive'
import { HorizontalVerticalPowerSharingVisual } from './visuals/HorizontalVerticalPowerSharingVisual'
import { Terrain3DVisual } from './visuals/Terrain3DVisual'
import { VisualGenerationState } from './visuals/VisualGenerationState'
import { SyrkaVisualComposer } from './visuals/syrka/SyrkaVisualComposer'
import type { Learning3DVisualSpec } from '@/lib/campus-types/learning-3d-visual-spec'
import type { VisualNarrative } from '@/lib/campus-types/semantic-concept-model'

/**
 * Mafs (the interactive-graph library) must never ship in the shared
 * bundle for all 52 concept routes — only the specific concept that uses
 * it should pay that weight. Dynamically imported, same pattern as
 * Terrain3DVisual's own lazy R3F scene.
 */
const CreditRepaymentGraph = dynamic(() => import('./visuals/graph/CreditRepaymentGraph').then((m) => m.CreditRepaymentGraph), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full" />,
})

/** A secondary bespoke interactive shown alongside the primary visual — see ADR §12 for why the other three subjects are not yet covered. */
const HAS_BESPOKE_INTERACTIVE = new Set(['ncert-concept-eco-3-2'])

/** Bespoke interactives that ARE the primary visual (representation-router.ts selects renderer 'custom_interactive' for these conceptIds). */
const CUSTOM_INTERACTIVE_COMPONENT: Record<string, () => JSX.Element> = {
  'ncert-concept-geo-4-2': FarmingClassificationInteractive,
  'ncert-concept-pol-1-1': HorizontalVerticalPowerSharingVisual,
}

/**
 * Restrained Student-facing labels only — never a trace id, a fallback
 * reason, or "attempted and failed" wording in the ordinary lesson (see
 * docs/adr/LEARN-002-adaptive-visual-learning-system.md). The full
 * diagnostic detail (resultCategory, keyConfigured, requestId) stays in
 * server logs and the Preview-only /api/learning/diagnostics/deepseek
 * route, never rendered here.
 */
const STUDENT_RESULT_LABEL: Record<string, string> = {
  deepseek_live: 'Generated with DeepSeek V4-Pro',
  deepseek_cached: 'Generated with DeepSeek V4-Pro · cached',
  deterministic_unavailable: 'Syrka fallback used',
  deterministic_not_configured: 'Syrka fallback used',
}

interface VisualiseResult {
  renderer: 'syrka_visual' | 'desmos' | 'mafs_graph' | 'three_scene' | 'custom_interactive'
  generationSource: string
  decision?: { reason: string; alternativesConsidered: { renderer: string; rejectedBecause: string }[] }
  threeSpec?: Learning3DVisualSpec
  narrative?: VisualNarrative
  semanticTrace?: { requestId: string; keyConfigured: boolean; liveRequestAttempted: boolean; authenticationSucceeded: boolean | null; requestedModel: string; resultCategory: string }
}

export interface ConceptWorkbenchProps {
  view: NcertConceptWorkbenchView
}

type Step = 'learn' | 'try' | 'test' | 'explain_back' | 'understand'

/**
 * CLASSX-001 §3 — a genuine concept workbench (Learn → Try → Test →
 * Understand your result), reused across all 52 concepts in all 26
 * chapters (not one hand-written page per concept). Evaluation is
 * deterministic and visible (evaluateConceptResponse), never a black-box
 * score. Nothing here is persisted across a page reload — that limit is
 * stated honestly in the "Understand your result" panel, matching this
 * whole demonstration environment's convention.
 */
export function ConceptWorkbench({ view }: ConceptWorkbenchProps) {
  const [step, setStep] = useState<Step>('learn')
  const [tryResponse, setTryResponse] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [explainBackText, setExplainBackText] = useState('')
  const [attemptsCount, setAttemptsCount] = useState(0)
  const [hintsUsedCount, setHintsUsedCount] = useState(0)
  const [tryEvaluation, setTryEvaluation] = useState<ReturnType<typeof evaluateConceptResponse>>()
  const [testEvaluation, setTestEvaluation] = useState<ReturnType<typeof evaluateConceptResponse>>()
  const [diagnosing, setDiagnosing] = useState(false)
  const [visualPhase, setVisualPhase] = useState<'idle' | 'requesting' | 'awaiting' | 'composing'>('idle')
  const [visualResult, setVisualResult] = useState<VisualiseResult>()
  const [visualError, setVisualError] = useState(false)
  const reduceMotion = useReducedMotionSafe()

  async function handleVisualiseThis() {
    setVisualPhase('requesting')
    setVisualError(false)
    try {
      const device = typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop'
      // 'requesting' is real for the moment the request is constructed; once
      // the fetch is actually in flight we honestly relabel to 'awaiting' — no
      // fixed fake timer, just the true before/after of the one network call.
      const requestPromise = fetch('/api/learning/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId: view.spaceId, chapterId: view.chapterId, conceptId: view.conceptId, intent: 'concept_map', device }),
      })
      setVisualPhase('awaiting')
      const res = await requestPromise
      if (!res.ok) throw new Error('request failed')
      setVisualPhase('composing')
      const data = (await res.json()) as VisualiseResult
      setVisualResult(data)
    } catch {
      setVisualError(true)
    } finally {
      setVisualPhase('idle')
    }
  }

  function submitTry() {
    setDiagnosing(true)
    window.setTimeout(
      () => {
        const evaluation = evaluateConceptResponse(tryResponse, view.keyTerms)
        setTryEvaluation(evaluation)
        setAttemptsCount((n) => n + 1)
        setDiagnosing(false)
        if (evaluation.sufficient) setStep('test')
      },
      reduceMotion ? 0 : 400
    )
  }

  function requestHint() {
    setHintsUsedCount((n) => n + 1)
  }

  function submitTest() {
    setDiagnosing(true)
    window.setTimeout(
      () => {
        const evaluation = evaluateConceptResponse(testResponse, view.keyTerms)
        setTestEvaluation(evaluation)
        setDiagnosing(false)
        if (evaluation.sufficient) setStep('explain_back')
      },
      reduceMotion ? 0 : 400
    )
  }

  const transferSucceeded = Boolean(testEvaluation?.sufficient)
  const independent = hintsUsedCount === 0
  const explainBackGiven = explainBackText.trim().length > 0

  const sessionState: ConceptTutorSessionState = {
    lastResponseText: step === 'test' || step === 'explain_back' || step === 'understand' ? testResponse : tryResponse,
    hintsUsedCount,
    attemptsCount,
    transferAttempted: Boolean(testEvaluation),
    transferSucceeded,
    explainBackGiven,
    missingKeyTerms: (step === 'test' || step === 'understand' ? testEvaluation?.missingTerms : tryEvaluation?.missingTerms) ?? view.keyTerms,
  }

  const independenceLabel = !testEvaluation
    ? undefined
    : independent && transferSucceeded
      ? 'Independent transfer demonstrated'
      : transferSucceeded
        ? 'Guided — hint used before transfer succeeded'
        : 'Transfer not yet demonstrated'

  const evidenceEligible = transferSucceeded && independent && explainBackGiven

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1.5">
          {(['learn', 'try', 'test', 'explain_back', 'understand'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => (i <= indexOfStep(step) ? setStep(s) : undefined)}
                disabled={i > indexOfStep(step)}
                aria-current={step === s ? 'step' : undefined}
                className={`rounded-full border px-2.5 py-1 font-campus-mono text-[10px] uppercase tracking-wide ${
                  step === s
                    ? 'border-campus-ink-950 bg-campus-ink-950 text-campus-white dark:border-campus-stone-100 dark:bg-campus-stone-100 dark:text-campus-ink-950'
                    : i < indexOfStep(step)
                      ? 'border-campus-green-600 text-campus-green-600 dark:border-campus-green-dark dark:text-campus-green-dark'
                      : 'border-campus-border text-campus-faint'
                }`}
              >
                {STEP_LABEL[s]}
              </button>
              {i < 4 && <span className="text-campus-faint">→</span>}
            </div>
          ))}
        </div>

        {step === 'learn' && (
          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Learn</p>
            <p className="mt-2 font-campus-sans text-campus-base text-campus-text">{view.explanation}</p>
            {view.example && (
              <div className="mt-3 border-t border-campus-border pt-3">
                <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{view.example.prompt}</p>
                <ol className="mt-1.5 flex list-decimal flex-col gap-1 pl-4 font-campus-sans text-campus-sm text-campus-text">
                  {view.example.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            )}
            <p className="mt-3 font-campus-mono text-[10px] text-campus-muted">Source: {view.citation.bookTitle}, p.{view.citation.page}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setStep('try')} className="rounded-campus-sm bg-campus-ink-950 px-4 py-2 font-campus-sans text-campus-sm font-medium text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950">
                Start activity
              </button>
              {!visualResult && visualPhase === 'idle' && (
                <button type="button" onClick={handleVisualiseThis} className="rounded-campus-sm border border-campus-border px-3 py-2 font-campus-sans text-campus-sm text-campus-text hover:bg-campus-surface-raised">
                  Visualise this
                </button>
              )}
            </div>

            {visualPhase !== 'idle' && (
              <div className="mt-4">
                <VisualGenerationState phase={visualPhase} />
              </div>
            )}
            {visualError && (
              <p className="mt-4 font-campus-sans text-campus-xs text-campus-amber-600 dark:text-campus-amber-dark">Could not build a visual right now — the explanation above still covers this concept fully.</p>
            )}
            {visualResult && (
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Visualise this</p>
                  {visualResult.semanticTrace && (
                    <Badge tone="neutral">{STUDENT_RESULT_LABEL[visualResult.semanticTrace.resultCategory] ?? 'Syrka fallback used'}</Badge>
                  )}
                </div>
                {visualResult.decision && (
                  <p className="font-campus-sans text-campus-xs text-campus-muted">
                    Why this representation: {visualResult.decision.reason}
                  </p>
                )}
                {visualResult.renderer === 'syrka_visual' && visualResult.narrative ? (
                  <SyrkaVisualComposer narrative={visualResult.narrative} />
                ) : visualResult.renderer === 'three_scene' && visualResult.threeSpec ? (
                  <Terrain3DVisual spec={visualResult.threeSpec} />
                ) : visualResult.renderer === 'mafs_graph' && view.conceptId === 'ncert-concept-eco-3-2' ? (
                  <CreditRepaymentGraph />
                ) : visualResult.renderer === 'custom_interactive' && CUSTOM_INTERACTIVE_COMPONENT[view.conceptId] ? (
                  (() => {
                    const Component = CUSTOM_INTERACTIVE_COMPONENT[view.conceptId]
                    return <Component />
                  })()
                ) : null}
              </div>
            )}

            {HAS_BESPOKE_INTERACTIVE.has(view.conceptId) && (
              <div className="mt-4">
                <EconomicsCreditSimulator />
              </div>
            )}
          </div>
        )}

        {step === 'try' && (
          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Try</p>
            <p className="mt-2 font-campus-sans text-campus-base font-medium text-campus-text">{view.tryPrompt}</p>
            <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">{view.tryInstructions}</p>
            <textarea
              value={tryResponse}
              onChange={(e) => setTryResponse(e.target.value)}
              rows={4}
              placeholder="Write your response…"
              className="mt-3 w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
            />
            {diagnosing ? (
              <div className="mt-3">
                <SyrkaIntelligenceState state="solving" label="Diagnosing your response" />
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={submitTry} disabled={!tryResponse.trim()} className="rounded-campus-sm bg-campus-ink-950 px-4 py-2 font-campus-sans text-campus-sm font-medium text-campus-white disabled:opacity-40 dark:bg-campus-stone-100 dark:text-campus-ink-950">
                  Submit
                </button>
                <button type="button" onClick={requestHint} className="rounded-campus-sm border border-campus-border px-3 py-1.5 font-campus-sans text-campus-xs text-campus-text hover:bg-campus-surface-raised">
                  Smallest useful hint
                </button>
              </div>
            )}
            {hintsUsedCount > 0 && !tryEvaluation && (
              <p className="mt-2 font-campus-sans text-campus-xs text-campus-amber-600 dark:text-campus-amber-dark">Hint: consider mentioning &ldquo;{view.keyTerms[0]}.&rdquo;</p>
            )}
            {tryEvaluation && !tryEvaluation.sufficient && (
              <div className="mt-3 rounded-campus-sm border border-campus-amber-600 p-3 dark:border-campus-amber-dark">
                <p className="font-campus-sans text-campus-sm text-campus-text">
                  Not quite yet — your response covers {tryEvaluation.coveredTerms.length} of {view.keyTerms.length} key ideas. Missing: {tryEvaluation.missingTerms.join(', ')}.
                </p>
                <button type="button" onClick={() => { setStep('try'); setHintsUsedCount((n) => n + 1) }} className="mt-2 rounded-campus-sm border border-campus-border px-3 py-1.5 font-campus-sans text-campus-xs text-campus-text hover:bg-campus-surface-raised">
                  Retry with the smallest useful hint
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'test' && (
          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Test — transfer</p>
            <p className="mt-2 font-campus-sans text-campus-base font-medium text-campus-text">{view.transferPrompt}</p>
            <textarea
              value={testResponse}
              onChange={(e) => setTestResponse(e.target.value)}
              rows={4}
              placeholder="Apply the concept to this new situation…"
              className="mt-3 w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
            />
            {diagnosing ? (
              <div className="mt-3">
                <SyrkaIntelligenceState state="solving" label="Checking your transfer" />
              </div>
            ) : (
              <button type="button" onClick={submitTest} disabled={!testResponse.trim()} className="mt-3 rounded-campus-sm bg-campus-ink-950 px-4 py-2 font-campus-sans text-campus-sm font-medium text-campus-white disabled:opacity-40 dark:bg-campus-stone-100 dark:text-campus-ink-950">
                Submit transfer
              </button>
            )}
            {testEvaluation && !testEvaluation.sufficient && (
              <p className="mt-3 font-campus-sans text-campus-sm text-campus-amber-600 dark:text-campus-amber-dark">
                Not yet — missing: {testEvaluation.missingTerms.join(', ')}. Try again once you&rsquo;ve reviewed those.
              </p>
            )}
          </div>
        )}

        {step === 'explain_back' && (
          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Explain it back</p>
            <p className="mt-2 font-campus-sans text-campus-base text-campus-text">In your own words: why does &ldquo;{view.title}&rdquo; matter, and what would change if it didn&rsquo;t hold?</p>
            <textarea
              value={explainBackText}
              onChange={(e) => setExplainBackText(e.target.value)}
              rows={3}
              placeholder="Explain it back…"
              className="mt-3 w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
            />
            <button
              type="button"
              onClick={() => setStep('understand')}
              disabled={!explainBackText.trim()}
              className="mt-3 rounded-campus-sm bg-campus-ink-950 px-4 py-2 font-campus-sans text-campus-sm font-medium text-campus-white disabled:opacity-40 dark:bg-campus-stone-100 dark:text-campus-ink-950"
            >
              Complete
            </button>
          </div>
        )}

        {step === 'understand' && (
          <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
            <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Understand your result</p>
            <dl className="mt-3 flex flex-col gap-2.5">
              <Row label="What your response demonstrated" value={`Covered ${testEvaluation?.coveredTerms.length ?? 0} of ${view.keyTerms.length} key ideas on transfer.`} />
              <Row label="Assistance used" value={hintsUsedCount > 0 ? `${hintsUsedCount} hint${hintsUsedCount === 1 ? '' : 's'} requested` : 'None'} />
              <Row label="Independence" value={independenceLabel ?? 'Not yet determined'} />
              <Row label="Learning Observation" value={`Recorded (session-only, not persisted): ${independent ? 'independent' : 'guided'} attempt, transfer ${transferSucceeded ? 'succeeded' : 'not yet demonstrated'}.`} />
              <Row
                label="Evidence eligibility"
                value={evidenceEligible ? 'Eligible for Faculty review as an Evidence candidate.' : 'Not yet eligible — needs an independent (no-hint) transfer plus an explain-back.'}
              />
              <Row label="Capability relationship" value={`${view.capability.name} (${view.capability.domain})`} />
              <Row label="Next action" value={view.nextConcept ? `Continue to "${view.nextConcept.title}"` : 'This is the last supplied concept in this subject.'} />
            </dl>
            <p className="mt-4 font-campus-mono text-[10px] text-campus-muted">This session is not persisted — reloading the page resets it.</p>
            {view.nextConcept && (
              <Link
                href={`/student/learning/${view.nextConcept.spaceId}/${view.nextConcept.chapterId}/${view.nextConcept.conceptId}`}
                className="mt-3 inline-block rounded-campus-sm bg-campus-ink-950 px-4 py-2 font-campus-sans text-campus-sm font-medium text-campus-white dark:bg-campus-stone-100 dark:text-campus-ink-950"
              >
                Continue to next concept →
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <ConceptTutorPanel view={view} sessionState={sessionState} />
        {evidenceEligible && (
          <div className="rounded-campus-md border border-campus-green-600 bg-campus-surface p-4 dark:border-campus-green-dark">
            <Badge tone="green">Evidence-eligible</Badge>
            <p className="mt-1.5 font-campus-sans text-campus-xs text-campus-text">This attempt would be eligible as a Learning Observation for Faculty review — not yet accepted Evidence.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function indexOfStep(step: Step): number {
  return (['learn', 'try', 'test', 'explain_back', 'understand'] as Step[]).indexOf(step)
}

const STEP_LABEL: Record<Step, string> = { learn: 'Learn', try: 'Try', test: 'Test', explain_back: 'Explain back', understand: 'Understand' }

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{label}</dt>
      <dd className="mt-0.5 font-campus-sans text-campus-sm text-campus-text">{value}</dd>
    </div>
  )
}
