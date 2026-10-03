'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export interface MarqueeRow {
  content: ReactNode
  direction: 1 | -1
  /** How far the row travels per screen of scroll, relative to the default. */
  speed?: number
  className?: string
}

/**
 * Giant rows of text that slide sideways as the page scrolls, alternate rows in opposite directions. Movement is
 * tied to scroll position (not a timer), so it stops when the reader stops; fast scrolling leans the rows in the
 * direction of travel and they settle back when scrolling stops. Static under reduced motion.
 */
export function ScrollMarquee({ rows, className = '' }: { rows: MarqueeRow[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0, lastY = window.scrollY, lastT = performance.now(), skew = 0, target = 0

    const apply = () => {
      const r = el.getBoundingClientRect()
      // 0 as the block enters the bottom of the screen, 1 as it leaves the top.
      const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight + r.height)))
      rowRefs.current.forEach((row, i) => {
        if (!row) return
        const { direction, speed = 1 } = rows[i]
        const travel = 25 * speed
        const x = direction === 1 ? -travel + p * travel : -p * travel
        row.style.transform = `translate3d(${x}%, 0, 0) skewX(${(skew * direction).toFixed(2)}deg)`
      })
    }
    const loop = (now: number) => {
      raf = 0
      const dt = Math.max(1, now - lastT)
      const v = (window.scrollY - lastY) / dt // px per ms
      lastY = window.scrollY; lastT = now
      target = Math.max(-12, Math.min(12, -v * 6))
      skew += (target - skew) * 0.18
      apply()
      if (Math.abs(skew) > 0.05 || Math.abs(target) > 0.05) raf = requestAnimationFrame(loop)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(loop) }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [rows])

  return (
    <div ref={ref} aria-hidden="true" className={`overflow-hidden ${className}`}>
      {rows.map((row, i) => (
        <div
          key={i}
          ref={el => { rowRefs.current[i] = el }}
          className={`flex w-max whitespace-nowrap will-change-transform ${row.className ?? ''}`}
        >
          {/* Four copies so the row never runs out while it slides. */}
          {[0, 1, 2, 3].map(k => <span key={k} className="pr-[0.3em]">{row.content}</span>)}
        </div>
      ))}
    </div>
  )
}
