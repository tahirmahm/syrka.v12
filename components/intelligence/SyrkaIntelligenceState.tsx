'use client'

import { ThinkingOrb, type OrbState } from 'thinking-orbs'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'

/**
 * Syrka's own vocabulary for AI/agent activity, independent of whatever
 * orb package renders it underneath. Every call site in the app imports
 * this component, never `thinking-orbs` directly, so the rendering
 * implementation can change without touching Odyssey Tutor, Learning
 * Tutor, Odyssey generation, or the public Campus preview.
 */
export type SyrkaIntelligenceStateValue =
  | 'listening'
  | 'searching'
  | 'solving'
  | 'composing'
  | 'shaping'
  | 'working'
  | 'error'
  | 'completed'

const ORB_STATE_MAP: Record<SyrkaIntelligenceStateValue, OrbState> = {
  listening: 'listening',
  searching: 'searching',
  solving: 'solving',
  composing: 'composing',
  shaping: 'shaping',
  working: 'working',
  error: 'solving',
  completed: 'working',
}

const DEFAULT_LABEL: Record<SyrkaIntelligenceStateValue, string> = {
  listening: 'Listening',
  searching: 'Searching your Odyssey and Evidence records',
  solving: 'Analysing capability data',
  composing: 'Composing a response',
  shaping: 'Reshaping your plan',
  working: 'Thinking',
  error: 'Something went wrong — try again',
  completed: 'Done',
}

export interface SyrkaIntelligenceStateProps {
  /** Semantic Syrka operation. `error` and `completed` are terminal — never shown as ongoing activity. */
  state?: SyrkaIntelligenceStateValue
  /** Overrides the default per-state label — keep it specific to what's actually happening. */
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Reserved for genuine AI/agent activity — Odyssey generation and
 * replanning, AI Tutor responses, capability/Evidence analysis, the
 * public Campus AI preview. Never for ordinary navigation, filter
 * changes, or a plain repository fetch — use Skeleton for those.
 *
 * Idle is not a state this component renders: callers only mount it while
 * an operation is genuinely in flight, and swap to `completed` briefly on
 * success or `error` on failure rather than leaving it spinning forever.
 */
export function SyrkaIntelligenceState({ state = 'working', label, size = 'sm', className = '' }: SyrkaIntelligenceStateProps) {
  const reduceMotion = useReducedMotionSafe()
  const orbSize = size === 'sm' ? 20 : 64
  const resolvedLabel = label ?? DEFAULT_LABEL[state]
  const isTerminal = state === 'error' || state === 'completed'

  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <ThinkingOrb
        state={ORB_STATE_MAP[state]}
        size={orbSize}
        paused={Boolean(reduceMotion) || isTerminal}
        aria-label={resolvedLabel}
      />
      <span className={`font-campus-sans text-campus-xs ${state === 'error' ? 'text-campus-red-600' : 'text-campus-muted'}`}>
        {resolvedLabel}
      </span>
    </span>
  )
}
