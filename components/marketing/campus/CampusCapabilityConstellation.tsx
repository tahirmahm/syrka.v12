'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, stagger } from 'animejs'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'

export type InstitutionalLens = 'faculty' | 'department' | 'university'

const CLUSTER_CENTERS: Record<InstitutionalLens, { x: number; y: number }> = {
  faculty: { x: 90, y: 150 },
  department: { x: 230, y: 90 },
  university: { x: 370, y: 150 },
}

/** Deterministic scatter positions — fixed, not Math.random(), so server/client markup matches exactly. */
const SIGNAL_SEEDS = [
  [30, 40], [60, 210], [110, 30], [150, 230], [20, 120], [80, 260], [180, 40], [200, 200], [40, 180], [130, 20],
  [230, 250], [260, 60], [300, 220], [340, 40], [380, 240], [410, 100], [320, 130], [270, 170], [190, 120], [100, 100],
  [350, 180], [50, 70], [160, 160], [290, 90], [220, 30], [70, 230], [400, 60], [140, 270], [310, 260], [10, 200],
] as const

/**
 * Institutional Evidence signals converging into a Faculty, Department, or
 * University cluster — the one place in this page that uses Anime.js
 * (per the founder's explicit, bounded authorisation) rather than
 * Framer Motion, since its DOM-target stagger/spring model is a better fit
 * for animating ~30 independent SVG points toward a moving target than
 * re-deriving the same thing in React state. Every other animation on this
 * page stays on Framer Motion — this component is the one exception, and
 * touches only its own element tree.
 */
export function CampusCapabilityConstellation({ lens }: { lens: InstitutionalLens }) {
  const reduceMotion = useReducedMotionSafe()
  const containerRef = useRef<SVGSVGElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted || !containerRef.current) return
    const target = CLUSTER_CENTERS[lens]
    const dots = containerRef.current.querySelectorAll<SVGCircleElement>('[data-signal]')

    if (reduceMotion) {
      dots.forEach((dot) => {
        dot.setAttribute('cx', String(target.x))
        dot.setAttribute('cy', String(target.y))
      })
      return
    }

    animate(dots, {
      cx: target.x,
      cy: target.y,
      duration: 900,
      delay: stagger(12),
      ease: 'outQuad',
    })
  }, [lens, mounted, reduceMotion])

  return (
    <svg ref={containerRef} viewBox="0 0 420 300" role="img" aria-label={`Institutional Evidence signals converging into a ${lens} view of capability`} className="h-auto w-full max-w-[420px]">
      {SIGNAL_SEEDS.map(([x, y], i) => (
        <circle key={i} data-signal cx={x} cy={y} r={3} className="fill-campus-blue-600/60 dark:fill-campus-blue-dark/60" />
      ))}
      <circle cx={CLUSTER_CENTERS[lens].x} cy={CLUSTER_CENTERS[lens].y} r={22} className="fill-campus-ink-950/10 dark:fill-campus-white/10" />
    </svg>
  )
}
