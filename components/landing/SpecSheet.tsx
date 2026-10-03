'use client'

import { useEffect, useRef } from 'react'

/*
 * The five-systems spec sheet, driven by scroll. As the section moves up the screen:
 *   - the stat numbers count up,
 *   - a spine runs down the row numbers, filling to a glowing tip, and each row slides in as the tip reaches it.
 * The stat cards pop up, staggered, the first time they come into view.
 * Progress is written to a CSS variable and to a few refs directly, so scrolling never re-renders React.
 */

export interface SpecRow {
  id: string
  name: string
  subtitle: string
  forWho: string
  takes: string
  gives: string
  live: boolean
  via?: string
  link?: { label: string; href: string }
}

export function SpecStats({ stats }: { stats: { value: number; label: string }[] }) {
  const ref = useRef<HTMLDListElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const nums = Array.from(el.querySelectorAll<HTMLElement>('[data-count]'))
    const pop = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.dataset.in = ''; pop.disconnect() } }, { threshold: 0.35 })
    // Already on screen or scrolled past (e.g. loaded via #software): show the cards straight away.
    if (el.getBoundingClientRect().top < window.innerHeight) el.dataset.in = ''
    else pop.observe(el)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => pop.disconnect()
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight * 0.6)))
      const e = 1 - (1 - p) ** 3
      nums.forEach(n => { n.textContent = String(Math.round(Number(n.dataset.count) * e)) })
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(raf); pop.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])
  return (
    <dl ref={ref} className="lx-pop-group grid grid-cols-3 gap-2">
      {stats.map((stat, i) => (
        <div key={stat.label} className="lx-pop rounded-2xl border border-black/[0.08] bg-white/60 px-4 py-5 shadow-[0_12px_30px_-20px_rgba(43,43,255,0.35)]" style={{ animationDelay: `${i * 110}ms` }}>
          <dd data-count={stat.value} className="bg-gradient-to-br from-[#16122b] to-[#5b4bd6] bg-clip-text font-headline text-[clamp(36px,4vw,64px)] font-medium leading-none tracking-[-0.04em] text-transparent">{stat.value}</dd>
          <dt className="lx-mono mt-3 text-[#5b5b62]">{stat.label}</dt>
        </div>
      ))}
    </dl>
  )
}

export function SpecTable({ rows }: { rows: SpecRow[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let p = reduced ? 1 : 0

    const measure = () => {
      const r = el.getBoundingClientRect()
      // 0 when the table's top reaches 85% down the screen, 1 when its bottom reaches 55%.
      p = reduced ? 1 : Math.min(1, Math.max(0, (window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.3)))
      el.style.setProperty('--p', p.toFixed(4))
    }
    const onScroll = () => measure()

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [])

  const n = rows.length

  return (
    <div ref={ref} className="lx-spec relative overflow-x-auto" style={{ '--p': 0, '--n': n } as React.CSSProperties}>
      <table className="relative w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="lx-mono text-[#5b5b62]">
            {['', 'System', 'For', 'Takes in', 'Gives back', 'Status'].map(h => (
              <th key={h} scope="col" className="border-b border-black/15 px-4 pb-4 font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="relative">
          {rows.map((s, i) => (
            <tr key={s.id} id={s.id} className="lx-spec-row scroll-mt-28 border-b border-black/[0.08] transition-colors hover:bg-[#5b4bd6]/[0.05]" style={{ '--i': i } as React.CSSProperties}>
              <td className="relative px-4 py-7 align-top">
                {/* Spine segment for this row: fills as the scroll tip passes through it. */}
                <span aria-hidden="true" className="absolute bottom-0 left-[26px] top-0 w-px bg-black/10" />
                <span aria-hidden="true" className="lx-spine-fill absolute left-[26px] top-0 w-px bg-gradient-to-b from-[#7a5cff] to-[#4b3bd6]" />
                <span className="lx-spec-num lx-mono relative grid h-6 w-6 place-items-center rounded-full border border-[#5b4bd6]/40 bg-[#eeede8] !text-[10px] text-[#4b3bd6]">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </td>
              <th scope="row" className="px-4 py-7 align-top font-normal">
                <div className="text-[clamp(20px,1.7vw,26px)] font-medium tracking-[-0.02em] text-[var(--lx-ink)]">{s.name}</div>
                <div className="lx-serif mt-1 text-[18px] text-[#4b3bd6]">{s.subtitle}</div>
              </th>
              <td className="px-4 py-7 align-top text-[15px] text-[#26232f]">{s.forWho}</td>
              <td className="px-4 py-7 align-top text-[15px] text-[var(--lx-dim)]">{s.takes}</td>
              <td className="px-4 py-7 align-top text-[15px] text-[#26232f]">{s.gives}</td>
              <td className="px-4 py-7 align-top">
                <span className={`lx-mono inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${s.live ? 'bg-[#4b3bd6] text-white' : 'border border-dashed border-[#5b4bd6]/40 text-[#4b3bd6]'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${s.live ? 'lx-live-dot bg-white' : 'border border-[#5b4bd6]'}`} />
                  {s.live ? 'Live' : 'In development'}
                </span>
                {s.via && <div className="lx-mono mt-2 !text-[10px] text-[#8a8992]">{s.via}</div>}
                {s.link && !s.via && (
                  <a href={s.link.href} className="lx-mono mt-2 block !text-[11px] text-[#4b3bd6] no-underline hover:text-[#16122b]">{s.link.label}</a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
