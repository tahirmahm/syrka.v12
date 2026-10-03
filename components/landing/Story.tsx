'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import PixelVideo from './PixelVideo'

/* ── "Capability developed. / directed. / …" sticky scroller ───────────── */

export interface ScrollerItem {
  line: string
  /** Full product name, e.g. "Syrka Campus". */
  product: string
  /** One-word name shown large on the right, e.g. "CAMPUS". */
  short: string
  subtitle: string
  /** Who this stage serves, e.g. "ACADEMIA". */
  audience: string
  /** How far capability reaches at this stage. */
  reach: string
  description: string
}

/**
 * "How Syrka works", then "Capability developed. / directed. / …": pinned for one screen per slide. Slide 0 is the
 * `intro`; each later slide shows one stage only, its label, line and description bottom-left. The right column
 * holds the MorphField's anchor (data-morph-anchor), where the 3D shape for the slide is drawn.
 */
export function CapabilityScroller({ id, intro, items, videoSrc, backdrop, visuals = {} }: {
  id?: string
  intro: ReactNode
  items: ScrollerItem[]
  videoSrc?: string
  backdrop?: ReactNode
  /** A real component to show in the right column for a stage (keyed by `short`), in place of its 3D shape. */
  visuals?: Record<string, ReactNode>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState(0)
  const slides = items.length + 1
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const p = Math.min(0.999, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)))
      setSlide(Math.floor(p * slides))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll) }
  }, [slides])

  const active = slide - 1
  const current = active >= 0 ? items[active] : null

  return (
    <div id={id} ref={ref} style={{ height: `${slides * 80 + 30}vh` }}>
      <div data-morph-stage className="sticky top-0 z-[6] h-[100dvh] overflow-hidden">
        {backdrop}
        {videoSrc && (
          <>
            <PixelVideo src={videoSrc} className="opacity-35" />
            <div aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(90deg, var(--lx-bg), color-mix(in srgb, var(--lx-bg) 60%, transparent), color-mix(in srgb, var(--lx-bg) 30%, transparent))' }} />
          </>
        )}
        <div className="relative grid h-full grid-rows-[1fr_auto] gap-6 px-4 pb-10 pt-24 md:px-8 md:pb-14 lg:grid-cols-[1.05fr_1fr] lg:grid-rows-1 lg:gap-10 lg:pt-28">
          {/* Left: the stage's name and reach at the top; the intro, or the active stage, anchored to the bottom */}
          <div className="flex min-h-0 flex-col justify-between gap-8 max-lg:order-last">
            {current ? (
              <div key={current.short} className="lx-swap">
                <div className="lx-mono flex items-center gap-3 text-[#8f84c9]">
                  <span className="h-px w-8 bg-gradient-to-r from-[#7a5cff] to-transparent" />
                  Reach <span className="text-[#c9bcff]">→ {current.reach.toLowerCase()}</span>
                </div>
                <span className="lx-giant mt-4 block bg-gradient-to-br from-[#f1eeff] via-[#c9bcff] to-[#7a5cff] bg-clip-text pb-2 text-[clamp(40px,5vw,96px)] text-transparent">
                  {current.short}
                </span>
              </div>
            ) : <span />}

            {!current ? (
              <div key="intro" className="lx-swap">{intro}</div>
            ) : (
              <div>
                <div className="mb-8 flex items-center gap-4 max-lg:mb-5" aria-hidden="true">
                  <div className="flex gap-1.5">
                    {items.map((it, i) => (
                      <span
                        key={it.short}
                        className={`h-[3px] w-8 rounded-full transition-colors duration-500 md:w-12 ${i < active ? 'bg-[#5b4bd6]' : i === active ? 'bg-gradient-to-r from-[#7a5cff] to-[#b9a6ff]' : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                  <span className="lx-mono text-[#8f84c9]">
                    <span className="text-[#c9bcff]">{String(active + 1).padStart(2, '0')}</span> / {String(items.length).padStart(2, '0')}
                  </span>
                </div>

                <div key={current.short} className="lx-swap" aria-live="polite">
                  <div className="lx-mono flex flex-wrap items-center gap-x-3 gap-y-1 !text-[12px] text-[#a99bff]">
                    <span>{current.product}</span>
                    <span className="text-[#5f54a8]">/</span>
                    <span className="text-[#8f84c9]">For {current.audience.toLowerCase()}</span>
                  </div>
                  <p className="lx-serif mt-5 text-[clamp(26px,2.6vw,40px)] leading-tight text-[#9d8cff]">{current.subtitle}</p>
                  <p className="mt-4 max-w-xl text-[clamp(17px,1.4vw,21px)] leading-relaxed text-[var(--lx-dim)]">{current.description}</p>
                  <h3 className="mt-8 font-headline text-[clamp(44px,5.8vw,104px)] font-medium leading-[0.92] tracking-[-0.04em] text-[var(--lx-ink)] max-lg:mt-5">
                    {current.line}
                  </h3>
                </div>
              </div>
            )}
          </div>

          {/* Right: the whole column is the space the 3D shape settles into */}
          <div data-morph-anchor className="relative min-h-[220px]">
            {current && visuals[current.short] && (
              <div key={current.short} className="lx-swap absolute inset-0">{visuals[current.short]}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
