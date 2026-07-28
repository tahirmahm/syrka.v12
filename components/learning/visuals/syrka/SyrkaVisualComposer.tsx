'use client'

import { useState } from 'react'
import type { VisualNarrative, VisualTemplateId } from '@/lib/campus-types/semantic-concept-model'
import { SyrkaLearningVisual } from './SyrkaLearningVisual'

export interface SyrkaVisualComposerProps {
  narrative: VisualNarrative
}

/**
 * LEARN-002 visual-quality correction — the default Student-facing
 * "Visualise this" surface. Lets the learner switch composition
 * (Recommended / Alternative 1 / Alternative 2) without re-running the
 * semantic model — the underlying SemanticConceptModel never changes,
 * only which template renders it. A restrained chooser, not a gallery:
 * one button row, never more than three options.
 */
export function SyrkaVisualComposer({ narrative }: SyrkaVisualComposerProps) {
  const [selected, setSelected] = useState<VisualTemplateId>(narrative.candidates[0]?.templateId ?? 'causal_chain')
  const [showText, setShowText] = useState(false)

  const activeCandidate = narrative.candidates.find((c) => c.templateId === selected) ?? narrative.candidates[0]

  return (
    <figure className="flex flex-col gap-3 rounded-campus-md border border-campus-border bg-campus-surface p-4">
      {narrative.candidates.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Visual composition">
          {narrative.candidates.map((candidate, i) => (
            <button
              key={candidate.templateId}
              type="button"
              role="tab"
              aria-selected={selected === candidate.templateId}
              onClick={() => setSelected(candidate.templateId)}
              className={`rounded-full border px-3 py-1 font-campus-mono text-[10px] uppercase tracking-wide ${
                selected === candidate.templateId
                  ? 'border-campus-ink-950 bg-campus-ink-950 text-campus-white dark:border-campus-stone-100 dark:bg-campus-stone-100 dark:text-campus-ink-950'
                  : 'border-campus-border text-campus-muted hover:bg-campus-surface-raised'
              }`}
            >
              {i === 0 ? 'Recommended' : `Alternative ${i}`}
            </button>
          ))}
        </div>
      )}
      {activeCandidate && <p className="font-campus-sans text-campus-xs text-campus-muted">{activeCandidate.reason}</p>}

      <div className="pt-1">
        <SyrkaLearningVisual model={narrative.model} templateId={selected} />
      </div>

      <div className="border-t border-campus-border pt-3">
        <button
          type="button"
          onClick={() => setShowText((v) => !v)}
          aria-expanded={showText}
          className="font-campus-sans text-campus-xs font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark"
        >
          {showText ? 'Hide' : 'Show'} structured text equivalent
        </button>
        {showText && <p className="mt-2 font-campus-sans text-campus-xs text-campus-muted">{narrative.structuredTextEquivalent}</p>}
      </div>
    </figure>
  )
}
