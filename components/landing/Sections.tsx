'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import PixelVideo from './PixelVideo'

/*
 * Pinned, one-screen-per-slide sections in the same layout as the capability scroller: what the slide is about at
 * the top left, the slide's own text anchored bottom-left, and a visual filling the right column.
 */

export interface StageSlide {
  /** Short key, also shown as the giant gradient word, e.g. "EVIDENCE". */
  word: string
  /** Mono line above the giant word, e.g. "Layer → individual record". */
  top: string
  /** Mono labels above the subtitle, e.g. ["Step 01", "Source"]. */
  label: [string, string]
  subtitle: string
  body: string
  heading: string
}

/** Looping background video, faded into the section colour on the left so the text stays readable. */
function BackgroundVideo({ src }: { src: string }) {
  return (
    <>
      <PixelVideo src={src} className="opacity-30" />
      <div aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(90deg, var(--lx-bg) 0%, color-mix(in srgb, var(--lx-bg) 70%, transparent) 50%, color-mix(in srgb, var(--lx-bg) 35%, transparent) 100%)' }} />
    </>
  )
}

function StageSlides({ id, eyebrow, slides, visual, backdrop, videoSrc }: {
  id?: string
  eyebrow: string
  slides: StageSlide[]
  visual: (active: number) => ReactNode
  backdrop?: ReactNode
  /** Optional looping background video, e.g. '/media/graph.mp4'. */
  videoSrc?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const p = Math.min(0.999, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)))
      setActive(Math.floor(p * slides.length))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll) }
  }, [slides.length])

  const s = slides[active]

  return (
    <div id={id} ref={ref} className="scroll-mt-0" style={{ height: `${slides.length * 80 + 30}vh` }}>
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {backdrop}
        {videoSrc && <BackgroundVideo src={videoSrc} />}
        <div className="relative grid h-full grid-rows-[1fr_auto] gap-6 px-4 pb-10 pt-24 md:px-8 md:pb-14 lg:grid-cols-[1.05fr_1fr] lg:grid-rows-1 lg:gap-10 lg:pt-28">
          <div className="flex min-h-0 flex-col justify-between gap-8 max-lg:order-last">
            <div key={s.word} className="lx-swap">
              <div className="lx-mono flex flex-wrap items-center gap-3 text-[#8f84c9]">
                <span className="h-px w-8 bg-gradient-to-r from-[#7a5cff] to-transparent" />
                {eyebrow}
                <span className="text-[#5f54a8]">/</span>
                <span className="text-[#c9bcff]">{s.top}</span>
              </div>
              <span className="lx-giant mt-4 block bg-gradient-to-br from-[#f1eeff] via-[#c9bcff] to-[#7a5cff] bg-clip-text pb-2 text-[clamp(40px,5vw,96px)] text-transparent">
                {s.word}
              </span>
            </div>

            <div>
              <div className="mb-8 flex items-center gap-4 max-lg:mb-5" aria-hidden="true">
                <div className="flex gap-1.5">
                  {slides.map((it, i) => (
                    <span
                      key={it.word}
                      className={`h-[3px] w-8 rounded-full transition-colors duration-500 md:w-12 ${i < active ? 'bg-[#5b4bd6]' : i === active ? 'bg-gradient-to-r from-[#7a5cff] to-[#b9a6ff]' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
                <span className="lx-mono text-[#8f84c9]">
                  <span className="text-[#c9bcff]">{String(active + 1).padStart(2, '0')}</span> / {String(slides.length).padStart(2, '0')}
                </span>
              </div>

              <div key={s.word} className="lx-swap" aria-live="polite">
                <div className="lx-mono flex flex-wrap items-center gap-x-3 gap-y-1 !text-[12px] text-[#a99bff]">
                  <span>{s.label[0]}</span>
                  <span className="text-[#5f54a8]">/</span>
                  <span className="text-[#8f84c9]">{s.label[1]}</span>
                </div>
                <p className="lx-serif mt-5 text-[clamp(26px,2.6vw,40px)] leading-tight text-[#9d8cff]">{s.subtitle}</p>
                <p className="mt-4 max-w-xl text-[clamp(17px,1.4vw,21px)] leading-relaxed text-[var(--lx-dim)]">{s.body}</p>
                <h3 className="mt-8 font-headline text-[clamp(44px,5.8vw,104px)] font-medium leading-[0.92] tracking-[-0.04em] text-[var(--lx-ink)] max-lg:mt-5">
                  {s.heading}
                </h3>
              </div>
            </div>
          </div>

          <div className="relative min-h-[260px]">{visual(active)}</div>
        </div>
      </div>
    </div>
  )
}

/* ── Who it is for: one illustrative panel per audience ───────────────── */

export interface AudiencePanel {
  title: string
  context: string
  stats: { value: string; label: string }[]
  /** "bars": one bar per row. "versus": two bars per row (supply vs demand). "match": ranked candidates. */
  kind: 'bars' | 'versus' | 'match'
  rows: { label: string; value: number; second?: number; note?: string; tags?: string[] }[]
  legend?: [string, string]
  footer: string
  /** Two small notification cards that float around the panel. */
  chips?: [string, string]
}

/** Counts the first number in `value` up from 0 when mounted, keeping its prefix, suffix and thousands commas. */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    const m = value.match(/^(\D*)([\d,.]+)(.*)$/)
    if (!el || !m || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const [, pre, num, post] = m
    const target = parseFloat(num.replace(/,/g, '')), decimals = num.includes('.') ? num.split('.')[1].length : 0
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 1100), e = 1 - (1 - t) ** 3
      const v = (target * e).toFixed(decimals)
      el.textContent = pre + (num.includes(',') ? Number(v).toLocaleString('en-US') : v) + post
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span ref={ref}>{value}</span>
}

/**
 * One audience's illustrative dashboard, floating in 3D: it sways slowly, tilts towards the pointer, and two
 * notification chips hover in front of it at different depths. Numbers count up and rows arrive in turn.
 */
function Panel({ panel }: { panel: AudiencePanel }) {
  const stage = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = stage.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3))
      el.style.setProperty('--my', (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3))
    }
    const onLeave = () => { el.style.setProperty('--mx', '0'); el.style.setProperty('--my', '0') }
    window.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    return () => { window.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave) }
  }, [])

  return (
    <div ref={stage} className="lx-float-stage relative w-full max-w-[560px]">
      <div className="lx-float3d">
        <div className="lx-sway">
          {panel.chips && (
            <>
              <div className="lx-chip lx-chip-a lx-mono">{panel.chips[0]}</div>
              <div className="lx-chip lx-chip-b lx-mono">{panel.chips[1]}</div>
            </>
          )}
    <div className="lx-swap relative w-full rounded-2xl border border-[#7a5cff]/25 bg-[#0d0b16]/85 p-5 shadow-[0_40px_90px_-30px_rgba(122,92,255,0.55)] backdrop-blur md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[17px] font-medium text-[var(--lx-ink)]">{panel.title}</div>
          <div className="lx-mono mt-1 text-[#8f84c9]">{panel.context}</div>
        </div>
        <span className="lx-mono shrink-0 rounded-full border border-[#7a5cff]/30 px-2.5 py-1 !text-[10px] text-[#a99bff]">Illustrative</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {panel.stats.map(s => (
          <div key={s.label} className="rounded-xl bg-white/[0.03] px-3 py-3">
            <div className="font-headline text-[clamp(20px,2vw,28px)] font-medium tracking-[-0.03em] text-[#e8e2ff]"><CountUp value={s.value} /></div>
            <div className="lx-mono mt-1 !text-[10px] text-[#8f84c9]">{s.label}</div>
          </div>
        ))}
      </div>

      {panel.legend && (
        <div className="lx-mono mt-5 flex gap-5 !text-[10px] text-[#8f84c9]">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#7a5cff]" />{panel.legend[0]}</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full border border-[#c9bcff]" />{panel.legend[1]}</span>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {panel.rows.map((r, i) => (
          <li key={r.label} className="lx-rise" style={{ animationDelay: `${180 + i * 90}ms` }}>
            {panel.kind === 'match' ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7a5cff] to-[#2b2bff] text-[12px] font-medium text-white">{r.label.slice(-1)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[14px] text-[var(--lx-ink)]">{r.label}</span>
                    <span className="font-headline text-[18px] font-medium text-[#e8e2ff]">{r.value}%</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {r.tags?.map(t => <span key={t} className="lx-mono rounded bg-[#7a5cff]/12 px-1.5 py-0.5 !text-[9.5px] text-[#c9bcff]">✓ {t}</span>)}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-[#cfcbe0]">{r.label}</span>
                  <span className="lx-mono !text-[11px] text-[#a99bff]">{r.note ?? `${r.value}%`}</span>
                </div>
                <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="lx-grow absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#3b3bff] via-[#7a5cff] to-[#b9a6ff]"
                    style={{ width: `${r.value}%`, animationDelay: `${i * 70}ms` }}
                  />
                  {r.second != null && (
                    <div className="absolute inset-y-[-1px] w-[2px] rounded bg-[#f1eeff]" style={{ left: `calc(${r.second}% - 1px)` }} />
                  )}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="lx-mono mt-5 border-t border-white/[0.06] pt-4 !text-[10.5px] text-[#8f84c9]">{panel.footer}</div>
    </div>
        </div>
      </div>
    </div>
  )
}

export function AudienceSlides({ id, slides, panels, backdrop, videoSrc }: {
  id?: string
  slides: StageSlide[]
  panels: AudiencePanel[]
  backdrop?: ReactNode
  videoSrc?: string
}) {
  return (
    <StageSlides
      id={id}
      eyebrow="Who it is for"
      slides={slides}
      backdrop={backdrop}
      videoSrc={videoSrc}
      visual={active => (
        <div className="flex h-full items-center justify-center">
          <Panel key={active} panel={panels[active]} />
        </div>
      )}
    />
  )
}
