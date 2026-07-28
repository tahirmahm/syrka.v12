'use client'

import 'mafs/core.css'
import './syrka-mafs-theme.css'
import { useId } from 'react'
import { Mafs, Coordinates } from 'mafs'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'

/**
 * LEARN-002 interactive-graph pass — Mafs adapted into Syrka's own visual
 * identity, never left at its default demo appearance. Mafs exposes its
 * whole palette as CSS custom properties (--mafs-bg/fg/line-color and the
 * eight accent colours); this wrapper overrides every one of them to the
 * same --campus-* tokens the rest of the product already uses, scoped to
 * `.syrka-mafs-theme` so it never leaks into any other Mafs instance or
 * unrelated UI.
 */
export function SyrkaMafsGraph({
  children,
  height = 340,
  viewBox,
  pan = false,
  zoom = false,
  ariaLabel,
  preserveAspectRatio = false,
}: {
  children: React.ReactNode
  height?: number
  viewBox?: { x?: [number, number]; y?: [number, number]; padding?: number }
  pan?: boolean
  zoom?: boolean | { min: number; max: number }
  ariaLabel: string
  /**
   * Default false (stretch to fill): most learning graphs here plot two
   * unrelated units against each other (e.g. months vs. rupees), where
   * preserving a 1:1 unit aspect ratio would compress a real, readable
   * curve into an unreadable sliver. Pass "contain" only for genuinely
   * geometric content (angles, circles, coordinate geometry) where 1:1
   * unit scaling is part of the point.
   */
  preserveAspectRatio?: 'contain' | false
}) {
  const reduceMotion = useReducedMotionSafe()
  const titleId = useId()

  return (
    <div
      className="syrka-mafs-theme overflow-hidden rounded-campus-sm border border-campus-border"
      role="img"
      aria-labelledby={titleId}
      data-reduce-motion={reduceMotion ? 'true' : 'false'}
    >
      <span id={titleId} className="sr-only">
        {ariaLabel}
      </span>
      <Mafs height={height} viewBox={viewBox} pan={pan} zoom={zoom} preserveAspectRatio={preserveAspectRatio}>
        <Coordinates.Cartesian
          xAxis={{ axis: true, lines: 2 }}
          yAxis={{ axis: true, lines: 2 }}
        />
        {children}
      </Mafs>
    </div>
  )
}
