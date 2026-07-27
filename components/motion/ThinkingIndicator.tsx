'use client'

import { useReducedMotionSafe } from './useReducedMotionSafe'

export type ThinkingIndicatorState = 'thinking' | 'searching' | 'composing'

const STATE_LABEL: Record<ThinkingIndicatorState, string> = {
  thinking: 'Thinking',
  searching: 'Searching your Odyssey and Evidence records',
  composing: 'Composing a response',
}

/**
 * A small, original semantic AI-activity indicator — inspired by the
 * interaction role of dotted "thought orb" loaders (a genuine AI-activity
 * state, distinct from an ordinary content skeleton) but implemented from
 * scratch in Syrka's own restrained style: three dots, plain CSS, no
 * canvas/WebGL, no third-party package. Reserved for real AI/agent work —
 * never used for ordinary navigation or repository fetches.
 */
export function ThinkingIndicator({ state = 'thinking', className = '' }: { state?: ThinkingIndicatorState; className?: string }) {
  const reduceMotion = useReducedMotionSafe()

  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-campus-blue-600 dark:bg-campus-blue-dark"
            style={
              reduceMotion
                ? { opacity: 0.5 }
                : {
                    animation: 'campus-thinking-dot 1.1s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s`,
                  }
            }
          />
        ))}
      </span>
      <span className="font-campus-sans text-campus-xs text-campus-muted">{STATE_LABEL[state]}</span>
      <style>{`
        @keyframes campus-thinking-dot {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </span>
  )
}
