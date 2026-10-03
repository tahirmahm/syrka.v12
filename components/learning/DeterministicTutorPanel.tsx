'use client'

import { useEffect, useState } from 'react'
import { Sparkle } from '@phosphor-icons/react/dist/ssr'
import { HINT_LADDER } from '@/lib/services/learning/tutor-state-machine'
import { SyrkaIntelligenceState } from '@/components/intelligence/SyrkaIntelligenceState'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import type { EvidencePipelineStage } from '@/lib/utilities/learning-projection'

type TutorActionId =
  | 'diagnose'
  | 'attempt'
  | 'misconception'
  | 'smallest_hint'
  | 'retry'
  | 'scaffold'
  | 'transfer'
  | 'explain_back'
  | 'relate_to_odyssey'
  | 'show_evidence_potential'
  | 'summary'

const ACTIONS: { id: TutorActionId; label: string }[] = [
  { id: 'diagnose', label: 'Explain this concept' },
  { id: 'attempt', label: 'Attempt' },
  { id: 'misconception', label: 'Diagnose my mistake' },
  { id: 'smallest_hint', label: 'Smallest useful hint' },
  { id: 'retry', label: 'Retry' },
  { id: 'scaffold', label: 'Scaffold' },
  { id: 'transfer', label: 'Test me with a different example' },
  { id: 'explain_back', label: 'Ask me to explain it back' },
  { id: 'relate_to_odyssey', label: 'Show how this relates to my Odyssey' },
  { id: 'show_evidence_potential', label: 'Show what could become Evidence' },
  { id: 'summary', label: 'Summary' },
]

const SCRIPTED_RESPONSES: Record<Exclude<TutorActionId, 'relate_to_odyssey' | 'show_evidence_potential'>, string> = {
  diagnose: 'Balancing an equation means making the number of atoms of every element identical on both sides — mass is conserved, so nothing may appear or disappear in the reaction.',
  attempt: 'Go ahead and try setting coefficients on both sides. Use the atom-count table to check your own work before submitting.',
  misconception: 'A common mix-up: changing a subscript (like H₂O → H₃O) changes what the substance is. Only coefficients — the numbers in front — may change.',
  smallest_hint: `Smallest useful hint: ${HINT_LADDER[3].description}`,
  retry: "That's not balanced yet — look at which element's count differs between the two sides, and adjust just that one coefficient.",
  scaffold: 'Try this smaller version first: balance H₂ + O₂ → H₂O on its own, then come back to the full equation with that pattern in mind.',
  transfer: 'Now apply the same balancing logic to a different reaction — the elements are different, but the method is identical.',
  explain_back: 'In your own words: why does the number of atoms have to match on both sides? Write a sentence or two below.',
  summary: "You've moved from a guided attempt to an independent transfer solution on a different equation — that's the strongest signal of real understanding this activity can produce.",
}

export interface DeterministicTutorPanelProps {
  odysseyConnection?: { milestoneId: string; milestoneTitle: string; capabilityName: string }
  evidencePipeline?: EvidencePipelineStage[]
}

/**
 * A visibly labelled deterministic Tutor: fixed, scripted responses keyed
 * to the chosen action, never a live model call. Reuses SyrkaIntelligenceState
 * for a brief, honestly-labelled "composing" transition (never a bare
 * spinner) before the response appears — the same shared processing-state
 * language as the Odyssey Tutor, so the two feel like one Tutor rather than
 * two unrelated features. "Show how this relates to my Odyssey" and "Show
 * what could become Evidence" read from the same projection data the rest
 * of the Learning page already shows, not a generic canned line.
 */
export function DeterministicTutorPanel({ odysseyConnection, evidencePipeline }: DeterministicTutorPanelProps) {
  const [selected, setSelected] = useState<TutorActionId>()
  const [composing, setComposing] = useState(false)
  const reduceMotion = useReducedMotionSafe()

  useEffect(() => {
    if (!selected) return
    setComposing(true)
    const timeout = window.setTimeout(() => setComposing(false), reduceMotion ? 0 : 450)
    return () => window.clearTimeout(timeout)
  }, [selected, reduceMotion])

  function response(id: TutorActionId): string {
    if (id === 'relate_to_odyssey') {
      return odysseyConnection
        ? `This lesson supports ${odysseyConnection.capabilityName}, which feeds directly into "${odysseyConnection.milestoneTitle}" on your Odyssey — completing it moves that milestone forward.`
        : 'This lesson is not currently linked to an active Odyssey milestone.'
    }
    if (id === 'show_evidence_potential') {
      const next = evidencePipeline?.find((s) => s.status !== 'complete')
      return next
        ? `Your strongest remaining step toward Evidence is "${next.label}": ${next.detail}`
        : 'Every stage from Attempt through Capability support is already complete for this lesson.'
    }
    return SCRIPTED_RESPONSES[id]
  }

  return (
    <div className="rounded-campus-md border border-campus-border bg-campus-surface p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkle size={14} className="text-campus-muted" aria-hidden="true" />
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Deterministic guided experience — not live AI</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => setSelected(action.id)}
            aria-pressed={selected === action.id}
            className={`rounded-full border px-2.5 py-1 font-campus-sans text-[11px] ${
              selected === action.id ? 'border-campus-ink-950 bg-campus-ink-950 text-campus-white dark:border-campus-stone-100 dark:bg-campus-stone-100 dark:text-campus-ink-950' : 'border-campus-border text-campus-text hover:bg-campus-surface-raised'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-3 rounded-campus-sm border border-campus-border p-3">
          {composing ? (
            <SyrkaIntelligenceState state="composing" label="Composing a response" />
          ) : (
            <p className="font-campus-sans text-campus-sm text-campus-text">{response(selected)}</p>
          )}
        </div>
      )}
      {!selected && <p className="mt-3 font-campus-sans text-campus-xs text-campus-muted">Select an action above to see the Tutor&rsquo;s scripted response for this stage.</p>}
    </div>
  )
}
