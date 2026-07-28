'use client'

import { useEffect, useState } from 'react'
import { Sparkle } from '@phosphor-icons/react/dist/ssr'
import { SyrkaIntelligenceState } from '@/components/intelligence/SyrkaIntelligenceState'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import type { NcertConceptWorkbenchView } from '@/lib/utilities/ncert-curriculum-projection'
import { CONCEPT_TUTOR_ACTIONS, conceptTutorActionLabel, getConceptTutorResponse, type ConceptTutorAction, type ConceptTutorSessionState } from '@/lib/services/learning/concept-tutor-engine'
import type { LearningResultCategory } from '@/lib/services/learning/providers/types'

export interface ConceptTutorPanelProps {
  view: NcertConceptWorkbenchView
  sessionState: ConceptTutorSessionState
}

/** Restrained Student-facing labels — no trace ids or fallback-reason wording in the ordinary lesson. */
const RESULT_CATEGORY_LABEL: Record<LearningResultCategory, string> = {
  deepseek_live: 'Generated with DeepSeek V4-Pro',
  deepseek_cached: 'Generated with DeepSeek V4-Pro · cached',
  deterministic_unavailable: 'Syrka fallback used',
  deterministic_not_configured: 'Syrka fallback used',
}

/**
 * The shared, concept-aware Tutor — one implementation used by every
 * concept in every Class X subject (CLASSX-001 §4), not a Chemistry-only
 * demonstration. Every response is grounded in the concept's real
 * curriculum data plus the live workbench session state passed down from
 * ConceptWorkbench (attempts, hints used, transfer/explain-back status) —
 * never one shared script reused verbatim across chapters.
 */
interface LiveDiagnosis {
  text: string
  resultCategory: LearningResultCategory
}

/**
 * Only "Diagnose my response" carries a live DeepSeek call (see
 * app/api/learning/tutor/diagnose/route.ts) — it is advisory and never
 * counts toward hint usage or Evidence eligibility, so a model result
 * varying run to run is safe here in a way it would not be for the
 * hint ladder. Every other action stays the deterministic engine below.
 */
function isLiveDiagnoseAction(action: ConceptTutorAction | undefined, sessionState: ConceptTutorSessionState): action is 'diagnose_response' {
  return action === 'diagnose_response' && Boolean(sessionState.lastResponseText)
}

export function ConceptTutorPanel({ view, sessionState }: ConceptTutorPanelProps) {
  const [selected, setSelected] = useState<ConceptTutorAction>()
  const [composing, setComposing] = useState(false)
  const [liveDiagnosis, setLiveDiagnosis] = useState<LiveDiagnosis | null>(null)
  const reduceMotion = useReducedMotionSafe()

  useEffect(() => {
    if (!selected) return
    setLiveDiagnosis(null)

    if (isLiveDiagnoseAction(selected, sessionState)) {
      let cancelled = false
      setComposing(true)
      fetch('/api/learning/tutor/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId: view.spaceId, chapterId: view.chapterId, conceptId: view.conceptId, responseText: sessionState.lastResponseText, sessionState }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('request failed'))))
        .then((result: { diagnosis: string; trace: { resultCategory: LearningResultCategory } }) => {
          if (cancelled) return
          setLiveDiagnosis({ text: result.diagnosis, resultCategory: result.trace.resultCategory })
        })
        .catch(() => {
          if (cancelled) return
          setLiveDiagnosis({ text: getConceptTutorResponse(selected, view, sessionState), resultCategory: 'deterministic_unavailable' })
        })
        .finally(() => {
          if (!cancelled) setComposing(false)
        })
      return () => {
        cancelled = true
      }
    }

    setComposing(true)
    const timeout = window.setTimeout(() => setComposing(false), reduceMotion ? 0 : 450)
    return () => window.clearTimeout(timeout)
  }, [selected, reduceMotion, view, sessionState])

  return (
    <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkle size={14} className="text-campus-muted" aria-hidden="true" />
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Deterministic guided Tutor — one action below uses live DeepSeek when configured</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CONCEPT_TUTOR_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => setSelected(action)}
            aria-pressed={selected === action}
            className={`rounded-full border px-2.5 py-1 font-campus-sans text-[11px] ${
              selected === action
                ? 'border-campus-ink-950 bg-campus-ink-950 text-campus-white dark:border-campus-stone-100 dark:bg-campus-stone-100 dark:text-campus-ink-950'
                : 'border-campus-border text-campus-text hover:bg-campus-surface-raised'
            }`}
          >
            {conceptTutorActionLabel(action)}
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-3 rounded-campus-sm border border-campus-border p-3">
          {composing ? (
            <SyrkaIntelligenceState state="composing" label="Composing a response" />
          ) : liveDiagnosis ? (
            <div className="flex flex-col gap-2">
              <p className="font-campus-sans text-campus-sm text-campus-text">{liveDiagnosis.text}</p>
              <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{RESULT_CATEGORY_LABEL[liveDiagnosis.resultCategory]}</p>
            </div>
          ) : (
            <p className="font-campus-sans text-campus-sm text-campus-text">{getConceptTutorResponse(selected, view, sessionState)}</p>
          )}
        </div>
      )}
      {!selected && <p className="mt-3 font-campus-sans text-campus-xs text-campus-muted">Select an action above — the Tutor answers using this concept&rsquo;s own material and your current session state.</p>}
    </div>
  )
}
