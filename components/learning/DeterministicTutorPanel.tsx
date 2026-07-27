'use client'

import { useState } from 'react'
import { Sparkle } from '@phosphor-icons/react/dist/ssr'
import { HINT_LADDER } from '@/lib/services/learning/tutor-state-machine'

type TutorActionId = 'diagnose' | 'attempt' | 'misconception' | 'smallest_hint' | 'retry' | 'scaffold' | 'transfer' | 'explain_back' | 'summary'

const ACTIONS: { id: TutorActionId; label: string }[] = [
  { id: 'diagnose', label: 'Diagnose' },
  { id: 'attempt', label: 'Attempt' },
  { id: 'misconception', label: 'Misconception' },
  { id: 'smallest_hint', label: 'Smallest useful hint' },
  { id: 'retry', label: 'Retry' },
  { id: 'scaffold', label: 'Scaffold' },
  { id: 'transfer', label: 'Transfer' },
  { id: 'explain_back', label: 'Explain-back' },
  { id: 'summary', label: 'Summary' },
]

const SCRIPTED_RESPONSES: Record<TutorActionId, string> = {
  diagnose: 'Before we start: what do you think "balancing" an equation means? There is no wrong answer here — it just tells me where to begin.',
  attempt: 'Go ahead and try setting coefficients on both sides. Use the atom-count table to check your own work before submitting.',
  misconception: 'A common mix-up: changing a subscript (like H₂O → H₃O) changes what the substance is. Only coefficients — the numbers in front — may change.',
  smallest_hint: `Smallest useful hint: ${HINT_LADDER[3].description}`,
  retry: "That's not balanced yet — look at which element's count differs between the two sides, and adjust just that one coefficient.",
  scaffold: 'Try this smaller version first: balance H₂ + O₂ → H₂O on its own, then come back to the full equation with that pattern in mind.',
  transfer: 'Now apply the same balancing logic to a different reaction — the elements are different, but the method is identical.',
  explain_back: 'In your own words: why does the number of atoms have to match on both sides? Write a sentence or two below.',
  summary: "You've moved from a guided attempt to an independent transfer solution on a different equation — that's the strongest signal of real understanding this activity can produce.",
}

/**
 * A visibly labelled deterministic Tutor: fixed, scripted responses keyed
 * to the chosen action, never a live model call. The existing hint-ladder
 * service is reused for content so the "smallest useful hint" response
 * stays consistent with the real hint policy, not an invented one.
 */
export function DeterministicTutorPanel() {
  const [selected, setSelected] = useState<TutorActionId>()

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
          <p className="font-campus-sans text-campus-sm text-campus-text">{SCRIPTED_RESPONSES[selected]}</p>
        </div>
      )}
      {!selected && <p className="mt-3 font-campus-sans text-campus-xs text-campus-muted">Select an action above to see the Tutor&rsquo;s scripted response for this stage.</p>}
    </div>
  )
}
