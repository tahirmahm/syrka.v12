'use client'

import { SyrkaIntelligenceState, type SyrkaIntelligenceStateValue } from '@/components/intelligence/SyrkaIntelligenceState'

export interface VisualGenerationStateProps {
  /** Which real phase of the request lifecycle this is — not a fabricated timer sequence. */
  phase: 'requesting' | 'awaiting' | 'composing' | 'timeout' | 'error'
}

const PHASE_TO_ORB: Record<VisualGenerationStateProps['phase'], SyrkaIntelligenceStateValue> = {
  requesting: 'searching',
  awaiting: 'solving',
  composing: 'composing',
  timeout: 'error',
  error: 'error',
}

const PHASE_LABEL: Record<VisualGenerationStateProps['phase'], string> = {
  requesting: 'Reading this concept and its learning objective',
  awaiting: 'Identifying the idea, actors and relationships',
  composing: 'Building the visual and accessible explanation',
  timeout: 'Taking longer than expected — showing the deterministic visual instead',
  error: 'Could not build a visual right now',
}

/**
 * LEARN-002 visual-quality correction — replaces a bare 20px orb (which
 * read as a decorative dot) with a genuinely prominent one during
 * "Visualise this". Only two phases are real network states
 * (requesting → awaiting a response); "composing" begins once the
 * response has actually arrived and the component tree is being built —
 * no phase here is a fixed fake timer disconnected from real work.
 */
export function VisualGenerationState({ phase }: VisualGenerationStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-campus-md border border-campus-border bg-campus-surface-raised px-4 py-10 sm:py-12">
      <SyrkaIntelligenceState state={PHASE_TO_ORB[phase]} label={PHASE_LABEL[phase]} size="md" />
      <div className="h-2 w-3/4 max-w-xs animate-pulse rounded-full bg-campus-border" aria-hidden="true" />
    </div>
  )
}
