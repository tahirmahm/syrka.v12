import type { Transition } from 'framer-motion'

/**
 * Shared Campus motion tokens — the single source of truth for durations,
 * springs, and easings across the authenticated Campus product (as opposed
 * to the corporate homepage's own cinematic motion system in
 * components/corporate/, which stays isolated). Centralising these means a
 * panel, a tab, and a node-selection transition all move at the same
 * cadence instead of each screen inventing its own numbers.
 */

export const campusMotion = {
  duration: {
    /** Micro state changes: hover, focus, small opacity shifts. */
    fast: 0.12,
    /** The default for most UI transitions: tabs, panel content swaps. */
    base: 0.2,
    /** Larger spatial movement: drawer/inspector open, list-to-detail. */
    slow: 0.32,
  },
  spring: {
    /** Panels and sheets that slide into place. */
    panel: { type: 'spring', stiffness: 340, damping: 32, mass: 0.9 } satisfies Transition,
    /** Small, snappy feedback — node selection, toggle state. */
    snappy: { type: 'spring', stiffness: 420, damping: 28, mass: 0.7 } satisfies Transition,
  },
  ease: {
    standard: [0.2, 0.8, 0.2, 1] as const,
    decelerate: [0.05, 0.7, 0.1, 1] as const,
  },
  distance: {
    /** How far a panel travels in from off-canvas, in pixels. */
    panelOffset: 24,
    /** Subtle vertical drift for entrance reveals. */
    reveal: 10,
  },
} as const

/** Inspector/drawer open — used for both the desktop side panel and the mobile bottom sheet. */
export function panelTransition(reduceMotion: boolean): Transition {
  return reduceMotion ? { duration: 0 } : campusMotion.spring.panel
}

/** Tab content swap and node-selection emphasis. */
export function stateTransition(reduceMotion: boolean): Transition {
  return reduceMotion ? { duration: 0 } : { duration: campusMotion.duration.base, ease: campusMotion.ease.standard }
}
