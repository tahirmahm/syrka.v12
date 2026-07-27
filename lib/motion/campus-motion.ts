import type { Transition } from 'framer-motion'

/**
 * Shared Campus motion tokens — the single source of truth for durations,
 * springs, easings, and derived transitions across the authenticated Campus
 * product (as opposed to the corporate homepage's own cinematic motion
 * system in components/corporate/, which stays isolated). Centralising
 * these means a panel, a tab, a route change, and a node-selection
 * transition all move at the same cadence instead of each screen inventing
 * its own numbers.
 *
 * Motion classification (see the Campus Experience Constitution): every
 * transition below is navigational, spatial, causal, feedback, or AI
 * activity — never purely decorative. Decorative motion stays isolated to
 * the corporate homepage.
 */

export const campusMotion = {
  duration: {
    /** Micro state changes: hover, focus, small opacity shifts — "instant feedback". */
    instant: 0.08,
    /** Small causal feedback: toggle state, checkbox, badge appearance. */
    micro: 0.12,
    /** The default for most UI transitions: tabs, panel content swaps. */
    standard: 0.2,
    /** Larger spatial movement: drawer/inspector open, list-to-detail. */
    panel: 0.32,
    /** Route-level change — deliberately quick, never a loading-screen-like pause. */
    route: 0.15,
    /** Large spatial transitions: list-to-graph, graph fit-to-view. */
    largeSpatial: 0.4,
    /** Backdrop/scrim fade for modals and drawers. */
    overlay: 0.18,
    /** @deprecated use `standard` */
    fast: 0.12,
    /** @deprecated use `standard` */
    base: 0.2,
    /** @deprecated use `panel` */
    slow: 0.32,
  },
  stagger: {
    /** Per-item delay for list/row reveal — small enough not to feel sluggish on long lists. */
    list: 0.045,
  },
  spring: {
    /** Panels and sheets that slide into place — inspector, bottom sheet. */
    panel: { type: 'spring', stiffness: 340, damping: 32, mass: 0.9 } satisfies Transition,
    /** Small, snappy feedback — node selection, toggle state, confirmation pulse. */
    snappy: { type: 'spring', stiffness: 420, damping: 28, mass: 0.7 } satisfies Transition,
    /** Gentler settle for larger surfaces — rail expansion, wallet-card return. */
    soft: { type: 'spring', stiffness: 260, damping: 30, mass: 1 } satisfies Transition,
    /** Quick, responsive drag/pointer-follow feedback (wallet-card tilt). */
    responsive: { type: 'spring', stiffness: 500, damping: 24, mass: 0.5 } satisfies Transition,
    /** Final settle after a spatial transition completes — fit-to-view, list-to-graph landing. */
    settle: { type: 'spring', stiffness: 200, damping: 34, mass: 1 } satisfies Transition,
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
  opacity: {
    /** Muted-but-legible state — Odyssey's focus-active dimming. */
    dimmed: 0.35,
    /** Backdrop/scrim behind a modal or drawer. */
    scrim: 0.5,
  },
} as const

/** Inspector/drawer/bottom-sheet open — desktop side panel and mobile sheet share this. */
export function panelTransition(reduceMotion: boolean): Transition {
  return reduceMotion ? { duration: 0 } : campusMotion.spring.panel
}

/** Tab content swap and node-selection emphasis. */
export function stateTransition(reduceMotion: boolean): Transition {
  return reduceMotion ? { duration: 0 } : { duration: campusMotion.duration.standard, ease: campusMotion.ease.standard }
}

/** Route-level change — quick fade, never a blocking pause. */
export function routeTransition(reduceMotion: boolean): Transition {
  return reduceMotion ? { duration: 0 } : { duration: campusMotion.duration.route, ease: campusMotion.ease.standard }
}

/** List-to-detail or list-to-graph mode change — a slightly larger spatial move than a tab swap. */
export function spatialTransition(reduceMotion: boolean): Transition {
  return reduceMotion ? { duration: 0 } : { duration: campusMotion.duration.largeSpatial, ease: campusMotion.ease.decelerate }
}

/** Modal/drawer backdrop fade. */
export function overlayTransition(reduceMotion: boolean): Transition {
  return reduceMotion ? { duration: 0 } : { duration: campusMotion.duration.overlay, ease: campusMotion.ease.standard }
}

/** Confirmation/success feedback — a small settle pulse, never a bounce loop. */
export function confirmationTransition(reduceMotion: boolean): Transition {
  return reduceMotion ? { duration: 0 } : campusMotion.spring.snappy
}

/** Per-index stagger delay for list/row reveal — pass the item's index. */
export function listStaggerDelay(index: number, reduceMotion: boolean): number {
  return reduceMotion ? 0 : index * campusMotion.stagger.list
}
