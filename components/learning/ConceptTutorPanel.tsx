'use client'

import { useEffect, useState } from 'react'
import { Sparkle } from '@phosphor-icons/react/dist/ssr'
import { SyrkaIntelligenceState } from '@/components/intelligence/SyrkaIntelligenceState'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import type { NcertConceptWorkbenchView } from '@/lib/utilities/ncert-curriculum-projection'
import { CONCEPT_TUTOR_ACTIONS, conceptTutorActionLabel, getConceptTutorResponse, type ConceptTutorAction, type ConceptTutorSessionState } from '@/lib/services/learning/concept-tutor-engine'

export interface ConceptTutorPanelProps {
  view: NcertConceptWorkbenchView
  sessionState: ConceptTutorSessionState
}

/**
 * The shared, concept-aware Tutor — one implementation used by every
 * concept in every Class X subject (CLASSX-001 §4), not a Chemistry-only
 * demonstration. Every response is grounded in the concept's real
 * curriculum data plus the live workbench session state passed down from
 * ConceptWorkbench (attempts, hints used, transfer/explain-back status) —
 * never one shared script reused verbatim across chapters.
 */
export function ConceptTutorPanel({ view, sessionState }: ConceptTutorPanelProps) {
  const [selected, setSelected] = useState<ConceptTutorAction>()
  const [composing, setComposing] = useState(false)
  const reduceMotion = useReducedMotionSafe()

  useEffect(() => {
    if (!selected) return
    setComposing(true)
    const timeout = window.setTimeout(() => setComposing(false), reduceMotion ? 0 : 450)
    return () => window.clearTimeout(timeout)
  }, [selected, reduceMotion])

  return (
    <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkle size={14} className="text-campus-muted" aria-hidden="true" />
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Deterministic guided Tutor · no live AI called</p>
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
          ) : (
            <p className="font-campus-sans text-campus-sm text-campus-text">{getConceptTutorResponse(selected, view, sessionState)}</p>
          )}
        </div>
      )}
      {!selected && <p className="mt-3 font-campus-sans text-campus-xs text-campus-muted">Select an action above — the Tutor answers using this concept&rsquo;s own material and your current session state.</p>}
    </div>
  )
}
