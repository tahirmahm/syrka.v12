'use client'

import { useRef, useState, type ReactNode } from 'react'
import { useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion'

export interface ScrollStageSequenceProps {
  stageCount: number
  /** Viewport-heights of scroll distance per stage — how long each stage stays pinned before advancing. */
  vhPerStage?: number
  /** Desktop, motion-enabled render: called with the currently active stage index and raw 0-1 progress. */
  children: (activeIndex: number, progress: number) => ReactNode
  /** Reduced-motion and mobile fallback: a plain, non-pinned render of one stage — called once per stage, stacked in normal document flow. */
  fallback: (index: number) => ReactNode
  /**
   * Optional per-stage anchor ids. Because the pinned desktop view only ever
   * renders the currently-active stage's content, a nav link to a specific
   * stage needs a real, always-present target to scroll to — these render
   * as invisible markers positioned at each stage's scroll offset.
   */
  stageIds?: string[]
}

/**
 * Generic sticky-pinned, scroll-linked multi-stage sequence. Reduced motion
 * (and, via CSS, narrow viewports) get the fully static `fallback` render
 * instead — never merely a slowed-down version of the same animation, a
 * genuinely different, simpler presentation with nothing pinned.
 */
export function ScrollStageSequence({ stageCount, vhPerStage = 100, children, fallback, stageIds }: ScrollStageSequenceProps) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setProgress(v)
    setActiveIndex(Math.min(stageCount - 1, Math.max(0, Math.floor(v * stageCount))))
  })

  return (
    <>
      <div className={reduceMotion ? 'flex flex-col gap-16' : 'flex flex-col gap-16 md:hidden'}>
        {Array.from({ length: stageCount }, (_, i) => (
          <div key={i}>{fallback(i)}</div>
        ))}
      </div>
      {!reduceMotion && (
        <div ref={ref} style={{ height: `${stageCount * vhPerStage}vh` }} className="relative hidden md:block">
          {stageIds?.map((stageId, i) => (
            <span key={stageId} id={stageId} className="absolute left-0 h-px w-px" style={{ top: `${(i / stageCount) * 100}%` }} aria-hidden="true" />
          ))}
          <div className="sticky top-0 flex h-screen items-center overflow-hidden">{children(activeIndex, progress)}</div>
        </div>
      )}
    </>
  )
}
