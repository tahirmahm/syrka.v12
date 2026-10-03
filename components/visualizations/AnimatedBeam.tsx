import { useId } from 'react'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'

export interface AnimatedBeamProps {
  from: { x: number; y: number }
  to: { x: number; y: number }
  viewBox?: string
  curvature?: number
  durationSeconds?: number
  label: string
  className?: string
}

/**
 * A signal travelling from a source node to a destination node along a
 * curved path — ported from Inspira UI's `AnimatedBeam.vue` (MIT,
 * `app/components/inspira/ui/animated-beam/AnimatedBeam.vue`), which is
 * Vue/Nuxt and was not installed. The technique itself — a static path
 * plus a second gradient-stroked overlay whose gradient coordinates sweep
 * along the path via native SVG `<animate>`, rather than a JS animation
 * loop — is reimplemented here in plain SVG/React, since `<animate>` has
 * no framework dependency to port. Reduced motion drops the `<animate>`
 * elements entirely, leaving a static dashed path with labelled endpoints.
 */
export function AnimatedBeam({ from, to, viewBox = '0 0 300 160', curvature = 40, durationSeconds = 2.6, label, className = '' }: AnimatedBeamProps) {
  const reduceMotion = useReducedMotionSafe()
  const gradientId = useId()
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - curvature }
  const pathD = `M ${from.x} ${from.y} Q ${mid.x} ${mid.y} ${to.x} ${to.y}`

  return (
    <svg role="img" aria-label={label} viewBox={viewBox} className={className}>
      <path d={pathD} fill="none" className="stroke-campus-border" strokeWidth={1.5} strokeDasharray={reduceMotion ? '3 4' : undefined} />
      {!reduceMotion && (
        <path d={pathD} fill="none" stroke={`url(#${gradientId})`} strokeWidth={2} strokeLinecap="round" />
      )}
      <circle cx={from.x} cy={from.y} r={4} className="fill-campus-blue-600 dark:fill-campus-blue-dark" />
      <circle cx={to.x} cy={to.y} r={4} className="fill-campus-green-600 dark:fill-campus-green-dark" />
      {!reduceMotion && (
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={`${from.x - 40}`} x2={`${from.x}`} y1={from.y} y2={to.y}>
            <stop stopColor="var(--campus-gold-500, #B89B5E)" stopOpacity={0} />
            <stop offset="55%" stopColor="var(--campus-gold-500, #B89B5E)" />
            <stop offset="100%" stopColor="var(--campus-gold-500, #B89B5E)" stopOpacity={0} />
            <animate
              attributeName="x1"
              values={`${from.x - 40}; ${to.x - 10}`}
              dur={`${durationSeconds}s`}
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0; 1"
              keySplines="0.16 1 0.3 1"
            />
            <animate
              attributeName="x2"
              values={`${from.x}; ${to.x + 30}`}
              dur={`${durationSeconds}s`}
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0; 1"
              keySplines="0.16 1 0.3 1"
            />
          </linearGradient>
        </defs>
      )}
    </svg>
  )
}
