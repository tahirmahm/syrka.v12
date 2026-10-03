'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import AsciiGlobe, { type GlobeFit } from './AsciiGlobe'
import { SyrkaLogo } from './brand'

const FIT: GlobeFit = { cx: 0.5, cy: 0.45, r: 0.3 }
const FIT_MOBILE: GlobeFit = { cx: 0.5, cy: 0.42, r: 0.4 }
const SEEN_KEY = 'syrka-loader-seen'
const GLYPHS = '#%+*=:-.x/\\'
const BAR_CELLS = 32

type Phase = 'loading' | 'exit' | 'done'

/** Full-screen intro: the globe assembles with the Syrka symbol, a counter runs, then a glyph-cell wipe reveals the page. */
export default function SiteLoader() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [pct, setPct] = useState(0)
  const wipeRef = useRef<HTMLCanvasElement>(null)
  // Decided once per mount: dev-mode effect double-invocation must not count as a repeat visit.
  const minMsRef = useRef<number | null>(null)

  // Progress: time-based, but holds at 90% until the page has actually loaded.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (minMsRef.current === null) {
      let seen = false
      try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; sessionStorage.setItem(SEEN_KEY, '1') } catch { /* storage blocked */ }
      minMsRef.current = reduced ? 300 : seen ? 700 : 2200
    }
    const minMs = minMsRef.current
    const html = document.documentElement
    html.style.overflow = 'hidden'

    let loaded = document.readyState === 'complete'
    const onLoad = () => { loaded = true }
    window.addEventListener('load', onLoad)
    // Never trap the visitor behind the loader if something is slow to finish.
    const bail = window.setTimeout(() => { loaded = true }, 6000)

    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const timeP = Math.min(1, (now - t0) / minMs)
      const eased = 1 - Math.pow(1 - timeP, 3)
      const p = loaded ? eased : Math.min(eased, 0.9)
      setPct(Math.round(p * 100))
      if (p >= 1) { setPhase('exit'); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(bail)
      window.removeEventListener('load', onLoad)
      html.style.overflow = ''
    }
  }, [])

  // Exit: black cells with grey glyphs cover the screen, then clear from the top in a ragged wave.
  // Layout effect + a synchronous first frame, so there's no one-frame flash between loader and wipe.
  useLayoutEffect(() => {
    if (phase !== 'exit') return
    document.documentElement.style.overflow = ''
    const canvas = wipeRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPhase('done'); return }
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth, h = window.innerHeight
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const size = w < 768 ? 14 : 20
    const cols = Math.ceil(w / size), rows = Math.ceil(h / size)
    const colDelay = Array.from({ length: cols }, () => Math.random() * 0.25)
    const family = getComputedStyle(canvas).fontFamily
    ctx.font = `${Math.round(size * 0.7)}px ${family}`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    const t0 = performance.now(), dur = 850
    let raf = 0
    const frame = (now: number) => {
      const p = (now - t0) / dur
      ctx.clearRect(0, 0, w, h)
      for (let c = 0; c < cols; c++) {
        const front = (p - colDelay[c]) * 1.35 * rows // rows cleared so far in this column
        for (let r = Math.max(0, Math.floor(front)); r < rows; r++) {
          const x = c * size, y = r * size
          const nearEdge = r - front < 3
          if (nearEdge && Math.random() < 0.45) continue
          ctx.fillStyle = nearEdge && Math.random() < 0.3 ? '#2e2e33' : '#050506'
          ctx.fillRect(x, y, size, size)
          if (nearEdge || Math.random() < 0.04) {
            ctx.fillStyle = Math.random() < 0.5 ? '#9a9aa0' : '#5f5f66'
            ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x + size / 2, y + size / 2)
          }
        }
      }
      if (p < 1 + 0.25 + 0.1) raf = requestAnimationFrame(frame)
      else setPhase('done')
    }
    frame(t0)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  if (phase === 'done') return null
  const filled = Math.round((pct / 100) * BAR_CELLS)

  return (
    <div id="lx-loader" className="fixed inset-0 z-[70]" aria-busy={phase === 'loading'} aria-label="Loading Syrka">
      <canvas ref={wipeRef} aria-hidden="true" className="absolute inset-0 h-full w-full" style={{ fontFamily: 'var(--lx-mono)' }} />
      {phase === 'loading' && (
        <div className="lx-dots absolute inset-0 bg-[#050506]">
          <AsciiGlobe emblem reveal fit={FIT} fitMobile={FIT_MOBILE} className="!cursor-default" />
          <div className="absolute inset-x-0 bottom-0 grid gap-6 px-4 pb-8 md:grid-cols-[1fr_auto_1fr] md:items-end md:px-8">
            <div className="lx-mono text-[var(--lx-dim)]">
              <div>/ Loading</div>
              <div className="font-headline text-[44px] font-light normal-case leading-none tracking-tight text-[var(--lx-ink)]">
                {String(pct).padStart(3, '0')}<span className="text-[var(--lx-dim)]">%</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <SyrkaLogo preload className="h-5 w-auto md:h-6" />
              <div className="flex gap-[3px]" aria-hidden="true">
                {Array.from({ length: BAR_CELLS }, (_, i) => (
                  <span key={i} className={`h-2 w-2 ${i < filled ? 'bg-[#bdbdc2]' : 'bg-[#1c1c20]'}`} />
                ))}
              </div>
            </div>
            <div className="lx-mono hidden text-right text-[var(--lx-dim)] md:block">
              <div>Systematic · Relational</div>
              <div className="lx-cursor">Knowledge · Architecture</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
