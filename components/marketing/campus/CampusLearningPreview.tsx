'use client'

import { useState } from 'react'
import { EvidencePipelineVisual } from '@/components/learning/visualizations/EvidencePipelineVisual'
import { AnimatedBeam } from '@/components/visualizations/AnimatedBeam'
import type { EvidencePipelineStage } from '@/lib/utilities/learning-projection'

const PIPELINE: EvidencePipelineStage[] = [
  { id: 'lesson', label: 'Lesson', status: 'complete', detail: 'Balancing chemical equations — a Chapter 1 demonstration lesson.' },
  { id: 'attempt', label: 'Attempt', status: 'complete', detail: 'A guided attempt at balancing Fe + H2O → Fe3O4 + H2.' },
  { id: 'hint', label: 'Hint', status: 'complete', detail: 'One partial clue requested, then a second attempt.' },
  { id: 'transfer', label: 'Transfer', status: 'complete', detail: 'An independent solution on a materially different equation.' },
  { id: 'observation', label: 'Observation', status: 'complete', detail: 'Recorded as an independent, transfer-eligible Learning Observation.' },
  { id: 'evidence', label: 'Evidence', status: 'complete', detail: 'Institutionally reviewed and disclosed as an Evidence candidate.' },
  { id: 'capability', label: 'Capability', status: 'complete', detail: 'Supports Data Modeling at Developing confidence.' },
]

const EQUATION_TERMS = ['1 Fe', '4 H₂O', '→', '1 Fe₃O₄', '4 H₂']

/**
 * A public, deterministic preview of the Learning Intelligence loop — the
 * same equation demonstration used in the real Student Learning workbench,
 * shown here as an inert illustration (no live attempt state) alongside
 * the actual pipeline visual. No private data, no raw Tutor transcript.
 */
export function CampusLearningPreview() {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <div className="flex-1 rounded-campus-md border border-campus-border bg-campus-surface p-6">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Demonstration activity — balancing chemical equations</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 font-campus-sans text-campus-lg text-campus-text">
          {EQUATION_TERMS.map((term) => (
            <span key={term} className={term === '→' ? 'text-campus-muted' : ''}>
              {term}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="mx-auto mt-5 block rounded-campus-sm border border-campus-border px-4 py-1.5 font-campus-sans text-campus-sm text-campus-text hover:bg-campus-surface-raised"
        >
          {revealed ? 'Hide observation detail' : 'Show what Syrka observed'}
        </button>
        {revealed && (
          <p className="mt-3 font-campus-sans text-campus-xs text-campus-muted">
            One partially guided attempt, then an independent transfer solution on N₂ + H₂ → NH₃ — the strongest signal this activity can produce, recorded as its own observation, never blended into a single score.
          </p>
        )}
      </div>
      <div className="flex-1 rounded-campus-md border border-campus-border bg-campus-surface p-6">
        <p className="mb-3 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Lesson to portable proof</p>
        <EvidencePipelineVisual stages={PIPELINE} />
        <div className="mt-5 flex items-center gap-3 border-t border-campus-border pt-4">
          <AnimatedBeam
            viewBox="0 0 140 60"
            from={{ x: 12, y: 48 }}
            to={{ x: 128, y: 48 }}
            curvature={26}
            label="This Observation travelling into the Capability it supports"
            className="h-12 w-36 shrink-0"
          />
          <p className="font-campus-sans text-campus-xs text-campus-muted">The Observation above is still travelling into the Capability record it supports — never merged until an institution reviews it.</p>
        </div>
      </div>
    </div>
  )
}
