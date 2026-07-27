'use client'

import { ThinkingOrb, type OrbState } from 'thinking-orbs'
import { useReducedMotionSafe } from './useReducedMotionSafe'

export type AIActivityState = 'thinking' | 'searching' | 'solving' | 'listening' | 'composing' | 'shaping'

const STATE_MAP: Record<AIActivityState, OrbState> = {
  thinking: 'working',
  searching: 'searching',
  solving: 'solving',
  listening: 'listening',
  composing: 'composing',
  shaping: 'shaping',
}

const STATE_LABEL: Record<AIActivityState, string> = {
  thinking: 'Thinking',
  searching: 'Searching your Odyssey and Evidence records',
  solving: 'Analysing capability data',
  listening: 'Listening',
  composing: 'Composing a response',
  shaping: 'Reshaping your plan',
}

export interface AIActivityIndicatorProps {
  /** Semantic Syrka operation, mapped internally onto the underlying orb's six tuned states. */
  state?: AIActivityState
  /** Overrides the default per-state label — keep it specific to what's actually happening. */
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Syrka's wrapper around the `thinking-orbs` package (installed as an
 * application dependency for this reason). The rest of Campus depends on
 * this component, never on `thinking-orbs` directly, so the underlying
 * implementation can be swapped later without touching call sites.
 *
 * Reserved for genuine AI/agent activity — Odyssey generation and
 * replanning, AI Tutor responses, capability/Evidence analysis, future
 * Praxis/Maxima agent operations. Never for ordinary navigation, filter
 * changes, or a plain repository fetch — use Skeleton for those.
 */
export function AIActivityIndicator({ state = 'thinking', label, size = 'sm', className = '' }: AIActivityIndicatorProps) {
  const reduceMotion = useReducedMotionSafe()
  const orbSize = size === 'sm' ? 20 : 64
  const resolvedLabel = label ?? STATE_LABEL[state]

  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <ThinkingOrb state={STATE_MAP[state]} size={orbSize} paused={Boolean(reduceMotion)} aria-label={resolvedLabel} />
      <span className="font-campus-sans text-campus-xs text-campus-muted">{resolvedLabel}</span>
    </span>
  )
}
