'use client'

import { useEffect, useState } from 'react'
import { Sparkle } from '@phosphor-icons/react/dist/ssr'
import { SyrkaIntelligenceState } from '@/components/intelligence/SyrkaIntelligenceState'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import type { NcertChapterView } from '@/lib/utilities/ncert-curriculum-projection'

type TutorActionId = 'explain' | 'hint' | 'diagnose' | 'transfer' | 'explain_back' | 'sources' | 'evidence' | 'capability' | 'odyssey'

const ACTIONS: { id: TutorActionId; label: string }[] = [
  { id: 'explain', label: 'Explain this concept' },
  { id: 'hint', label: 'Give me the smallest useful hint' },
  { id: 'diagnose', label: 'Diagnose my response' },
  { id: 'transfer', label: 'Ask a transfer question' },
  { id: 'explain_back', label: 'Ask me to explain it back' },
  { id: 'sources', label: 'Show relevant source references' },
  { id: 'evidence', label: 'Show what could become Evidence' },
  { id: 'capability', label: 'Show the Capability relationship' },
  { id: 'odyssey', label: 'Show the Odyssey relationship' },
]

/**
 * The chapter-aware Tutor for the NCERT curriculum-population release —
 * same SyrkaIntelligenceState "composing" transition and "not live AI"
 * labelling as DeterministicTutorPanel (Chapter 1's Chemistry Tutor), but
 * every response is grounded in this specific chapter's real concepts,
 * example, activity, and transfer question rather than one shared script.
 */
export function NcertChapterTutorPanel({ chapter }: { chapter: NcertChapterView }) {
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
    const [c1, c2] = chapter.concepts
    switch (id) {
      case 'explain':
        return c2 ? `${c1.title}: ${c1.description} This connects to ${c2.title.toLowerCase()} — ${c2.description}` : c1.description
      case 'hint':
        return chapter.example.steps[0]
          ? `Smallest useful hint: start where the guided analysis does — "${chapter.example.steps[0]}"`
          : `Smallest useful hint: reread the concept "${c1.title}" before attempting the activity.`
      case 'diagnose':
        return `Compare your answer against the guided analysis above, one step at a time — most gaps at this stage trace back to step ${Math.min(2, chapter.example.steps.length)}: "${chapter.example.steps[Math.min(1, chapter.example.steps.length - 1)] ?? ''}"`
      case 'transfer':
        return chapter.transferQuestion
      case 'explain_back':
        return `In your own words: explain "${c1.title}" and why it matters for this chapter — write a sentence or two.`
      case 'sources':
        return `This lesson cites ${chapter.citation.bookTitle}, page ${chapter.citation.page} (${chapter.citation.sourceLabel}).`
      case 'evidence':
        return `Not yet attempted. Completing "${chapter.activity.title}" and this chapter's transfer question, once teacher-reviewed, would be this chapter's first Evidence candidate toward ${chapter.capability.name}.`
      case 'capability':
        return `This chapter supports ${chapter.capability.name} (${chapter.capability.domain}): ${chapter.capability.description}`
      case 'odyssey':
        return chapter.capability.pathwayAdvisory
      default:
        return ''
    }
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
          {composing ? <SyrkaIntelligenceState state="composing" label="Composing a response" /> : <p className="font-campus-sans text-campus-sm text-campus-text">{response(selected)}</p>}
        </div>
      )}
      {!selected && <p className="mt-3 font-campus-sans text-campus-xs text-campus-muted">Select an action above to see the Tutor&rsquo;s scripted response for this chapter.</p>}
    </div>
  )
}
