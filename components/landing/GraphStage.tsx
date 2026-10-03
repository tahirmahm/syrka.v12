'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { seededRandom } from './seededRandom'
import type { StageSlide } from './Sections'
import PixelVideo from './PixelVideo'

/*
 * "The capability graph": one pinned, centred screen per step, over a pixelated real-life video. White text sits
 * in the middle; the six steps run along the bottom as a slim 3D chain whose active step opens into a white line
 * drawing of that step's symbol.
 */

type V3 = [number, number, number]
const GLITCH = '01<>/\\|_#@%'
/** Same accent the footer wordmark scrambles into (--lx-accent-ink on dark). */
const ACCENT = '#7a7aff'
const DEG = Math.PI / 180
type Poly = V3[]

/* ── Step objects as wireframes, roughly within ±0.6, matching the scroller's symbols ── */

const boxEdges = (c: V3, h: V3): Poly[] => {
  const p = (sx: number, sy: number, sz: number): V3 => [c[0] + sx * h[0], c[1] + sy * h[1], c[2] + sz * h[2]]
  return [
    [p(-1, -1, -1), p(1, -1, -1), p(1, 1, -1), p(-1, 1, -1), p(-1, -1, -1)],
    [p(-1, -1, 1), p(1, -1, 1), p(1, 1, 1), p(-1, 1, 1), p(-1, -1, 1)],
    [p(-1, -1, -1), p(-1, -1, 1)], [p(1, -1, -1), p(1, -1, 1)], [p(1, 1, -1), p(1, 1, 1)], [p(-1, 1, -1), p(-1, 1, 1)],
  ]
}
const arc = (c: V3, r: number, a0: number, a1: number, plane: 'xy' | 'xz', n = 40): Poly =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = a0 + (a1 - a0) * (i / n), u = Math.cos(t) * r, v = Math.sin(t) * r
    return plane === 'xy' ? [c[0] + u, c[1] + v, c[2]] : [c[0] + u, c[1], c[2] + v]
  })

const rect = (x0: number, y0: number, x1: number, y1: number, z: number): Poly => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [x0, y0, z]]
const rotY = (p: V3, a: number): V3 => [p[0] * Math.cos(a) - p[2] * Math.sin(a), p[1], p[0] * Math.sin(a) + p[2] * Math.cos(a)]
const rotZ = (p: V3, a: number): V3 => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]]

/** Evidence (Campus): a graduation cap with its tassel, as in the scroller above. */
function mortarboard(): Poly[] {
  const h = 0.46, corners: V3[] = [[h, 0, h], [-h, 0, h], [-h, 0, -h], [h, 0, -h]].map(c => rotY(c as V3, Math.PI / 4))
  const at = (y: number) => [...corners.map(([x, , z]): V3 => [x, y, z]), [corners[0][0], y, corners[0][2]] as V3]
  const out: Poly[] = [at(0.22), at(0.17), ...corners.map(([x, , z]): Poly => [[x, 0.22, z], [x, 0.17, z]])]
  out.push(arc([0, 0.17, 0], 0.28, 0, Math.PI * 2, 'xz', 40), arc([0, -0.2, 0], 0.28, 0, Math.PI * 2, 'xz', 40))
  for (let k = 0; k < 6; k++) { const t = (k / 6) * Math.PI * 2; out.push([[Math.cos(t) * 0.28, 0.17, Math.sin(t) * 0.28], [Math.cos(t) * 0.28, -0.2, Math.sin(t) * 0.28]]) }
  const tip = corners[0]
  out.push([[0, 0.23, 0], [tip[0] * 0.95, 0.23, tip[2] * 0.95], [tip[0] * 0.95, -0.12, tip[2] * 0.95]])
  for (let k = -2; k <= 2; k++) out.push([[tip[0] * 0.95, -0.12, tip[2] * 0.95], [tip[0] * 0.95 + k * 0.012, -0.24, tip[2] * 0.95 + k * 0.012]])
  return out
}

/** Capability: the faceted crystal from the Syrka mark, the one shared record. */
function crystal(): Poly[] {
  const f = (1 + Math.sqrt(5)) / 2, r = 0.48, norm = Math.hypot(1, f)
  const v: V3[] = ([[-1, f, 0], [1, f, 0], [-1, -f, 0], [1, -f, 0], [0, -1, f], [0, 1, f], [0, -1, -f], [0, 1, -f], [f, 0, -1], [f, 0, 1], [-f, 0, -1], [-f, 0, 1]] as V3[])
    .map(([x, y, z]) => [(x / norm) * r, (y / norm) * r, (z / norm) * r])
  const edge = (2 / norm) * r * 1.01, out: Poly[] = []
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) {
    if (Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]) <= edge) out.push([v[i], v[j]])
  }
  return out
}

/** Odyssey: a compass, needle pointing up and to the right. */
function compass(): Poly[] {
  const out: Poly[] = [arc([0, 0, 0], 0.5, 0, Math.PI * 2, 'xy', 56), arc([0, 0, 0], 0.44, 0, Math.PI * 2, 'xy', 50), arc([0, 0, -0.07], 0.5, 0, Math.PI * 2, 'xy', 56)]
  for (let k = 0; k < 16; k++) {
    const t = (k / 16) * Math.PI * 2, r0 = k % 4 === 0 ? 0.32 : 0.38
    out.push([[Math.cos(t) * r0, Math.sin(t) * r0, 0], [Math.cos(t) * 0.44, Math.sin(t) * 0.44, 0]])
  }
  const a = -35 * DEG
  const n: V3[] = ([[0, 0.4, 0.02], [0.07, 0, 0.02], [0, -0.4, 0.02], [-0.07, 0, 0.02], [0, 0.4, 0.02]] as V3[]).map(p => rotZ(p, a))
  out.push(n, [rotZ([0.07, 0, 0.02], a), rotZ([-0.07, 0, 0.02], a)], arc([0, 0, 0.03], 0.03, 0, Math.PI * 2, 'xy', 12))
  return out
}

/** Passport: the Syrka ID card — header, seal, avatar, name, fields, QR and the reviewed badge. */
function syrkaId(): Poly[] {
  const W = 0.6, H = 0.4, z = 0.012, out: Poly[] = []
  // Rounded card outline, front and back.
  const card = (zz: number): Poly => {
    const r = 0.07, pts: V3[] = []
    for (const [cx, cy, a0] of [[W - r, H - r, 0], [-W + r, H - r, Math.PI / 2], [-W + r, -H + r, Math.PI], [W - r, -H + r, Math.PI * 1.5]] as const) {
      for (let i = 0; i <= 6; i++) { const t = a0 + (i / 6) * (Math.PI / 2); pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r, zz]) }
    }
    pts.push(pts[0])
    return pts
  }
  out.push(card(0), card(-0.04))
  out.push([[-0.5, 0.3, z], [-0.32, 0.3, z]], [[-0.5, 0.24, z], [-0.26, 0.24, z]]) // "Syrka" / "CAREER PASSPORT"
  out.push(arc([0.46, 0.27, z], 0.055, 0, Math.PI * 2, 'xy', 18), [[0.43, 0.27, z], [0.455, 0.245, z], [0.495, 0.295, z]]) // seal
  out.push(arc([-0.42, 0.05, z], 0.08, 0, Math.PI * 2, 'xy', 24)) // avatar
  out.push([[-0.29, 0.08, z], [-0.05, 0.08, z]], [[-0.29, 0.02, z], [-0.15, 0.02, z]]) // name, class
  for (const [x, y] of [[-0.5, -0.12], [-0.28, -0.12], [-0.5, -0.2], [-0.28, -0.2]]) out.push([[x, y, z], [x + 0.14, y, z]]) // fields
  out.push(rect(0.18, -0.3, 0.5, 0.02, z)) // QR panel
  for (const [x, y] of [[0.21, -0.07], [0.39, -0.07], [0.21, -0.27]]) out.push(rect(x, y, x + 0.08, y + 0.08, z))
  out.push([[0.33, -0.2, z], [0.47, -0.2, z]], [[0.33, -0.25, z], [0.4, -0.25, z]], [[0.33, -0.15, z], [0.36, -0.15, z]])
  out.push([[-0.5, -0.26, z], [0.1, -0.26, z]]) // divider
  out.push(rect(-0.5, -0.36, -0.12, -0.3, z)) // reviewed badge
  return out
}

/** Praxis: a briefcase. */
function briefcase(): Poly[] {
  return [
    ...boxEdges([0, -0.12, 0], [0.55, 0.34, 0.15]),
    [[-0.55, 0.08, 0.15], [0.55, 0.08, 0.15]],
    rect(-0.36, 0.03, -0.26, 0.12, 0.155), rect(0.26, 0.03, 0.36, 0.12, 0.155),
    [[-0.18, 0.22, 0], [-0.18, 0.38, 0], [0.18, 0.38, 0], [0.18, 0.22, 0]],
    [[-0.12, 0.22, 0], [-0.12, 0.33, 0], [0.12, 0.33, 0], [0.12, 0.22, 0]],
  ]
}

/** Maxima: a civic building with steps, columns and a pediment. */
function civic(): Poly[] {
  const out: Poly[] = [...boxEdges([0, -0.5, 0], [0.6, 0.04, 0.26]), ...boxEdges([0, -0.42, 0], [0.52, 0.04, 0.22])]
  for (let k = 0; k < 6; k++) {
    const x = -0.4 + k * 0.16
    out.push([[x - 0.025, -0.38, 0.18], [x - 0.025, 0.12, 0.18]], [[x + 0.025, -0.38, 0.18], [x + 0.025, 0.12, 0.18]])
  }
  out.push(...boxEdges([0, 0.17, 0], [0.54, 0.05, 0.22]))
  out.push([[-0.56, 0.22, 0.22], [0, 0.46, 0.22], [0.56, 0.22, 0.22]], [[-0.56, 0.22, -0.22], [0, 0.46, -0.22], [0.56, 0.22, -0.22]], [[0, 0.46, 0.22], [0, 0.46, -0.22]])
  return out
}

const OBJECTS = [mortarboard, crystal, compass, syrkaId, briefcase, civic]

/** Resample polylines to exactly K points along their length; `start` marks where a new stroke begins. */
const K = 900
function resample(polys: Poly[]) {
  const segs: { a: V3; b: V3; len: number }[] = []
  polys.forEach(pl => pl.slice(1).forEach((b, i) => {
    const a = pl[i]
    segs.push({ a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) })
  }))
  const total = segs.reduce((s, g) => s + g.len, 0)
  const p = new Float32Array(K * 3), start = new Uint8Array(K)
  // Each segment gets points in proportion to its length, at least 2 so every edge is drawn.
  let k = 0
  for (const g of segs) {
    const n = Math.max(2, Math.round((g.len / total) * K))
    for (let i = 0; i < n && k < K; i++, k++) {
      const u = i / (n - 1)
      p[k * 3] = g.a[0] + (g.b[0] - g.a[0]) * u; p[k * 3 + 1] = g.a[1] + (g.b[1] - g.a[1]) * u; p[k * 3 + 2] = g.a[2] + (g.b[2] - g.a[2]) * u
      start[k] = i === 0 ? 1 : 0
    }
  }
  // Pad any leftover slots onto the last point as zero-length strokes.
  for (; k < K; k++) { p.copyWithin(k * 3, (k - 1) * 3, k * 3); start[k] = 1 }
  return { p, start }
}

/* ── Graph strip ──────────────────────────────────────────────────────── */

function GraphStrip({ nodes, active, boundaryAfter }: { nodes: string[]; active: number; boundaryAfter: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)
  useEffect(() => { activeRef.current = active }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const family = getComputedStyle(canvas).fontFamily
    const n = nodes.length
    const objs = OBJECTS.slice(0, n).map(f => resample(f()))
    const scatter = Float32Array.from({ length: K * 3 }, seededRandom(23)).map(v => v * 2 - 1)
    const SPACING = 1.7
    const nodeY = (i: number) => Math.sin(i * 1.3) * 0.12
    const nodeZ = (i: number) => Math.cos(i * 1.1) * 0.25

    const from = new Float32Array(objs[0].p), cur = new Float32Array(objs[0].p)
    let fromStart = objs[0].start
    let target = 0, morphStart = -1e9, camX = 0
    // Pointer reaction, as on the footer wordmark: the drawing sparks into accent glitch glyphs near the pointer.
    let px = -9999, py = -9999, heat = 0
    let w = 0, h = 0

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas!.getBoundingClientRect()
      w = r.width; h = r.height
      if (w < 1 || h < 1) return
      canvas!.width = Math.round(w * dpr); canvas!.height = Math.round(h * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw(now: number, dt: number) {
      if (!w) return
      const a = activeRef.current
      if (a !== target) { fromStart = objs[target].start; from.set(cur); target = a; morphStart = now }
      camX += (a - camX) * (reduced ? 1 : Math.min(1, dt * 2.4))
      const t = reduced ? 1 : Math.min(1, (now - morphStart) / 900)
      const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
      const burst = Math.sin(Math.PI * t) * 0.18

      const U = Math.min(w * 0.1, h * 0.36) // px per world unit
      const cx0 = w / 2, cy0 = h * 0.5
      const tilt = -0.2, ct = Math.cos(tilt), st = Math.sin(tilt)
      const proj = (x: number, y: number, z: number): [number, number] => {
        const ry = y * ct - z * st, rz = y * st + z * ct
        const p = 4 / (4 - rz)
        return [cx0 + x * U * p, cy0 - ry * U * p]
      }
      const nx = (i: number) => (i - camX) * SPACING
      ctx!.clearRect(0, 0, w, h)
      ctx!.lineCap = 'round'; ctx!.lineJoin = 'round'

      // Links: solid up to the active step, dashed beyond it.
      for (let i = 0; i < n - 1; i++) {
        const [x0, y0] = proj(nx(i), nodeY(i), nodeZ(i)), [x1, y1] = proj(nx(i + 1), nodeY(i + 1), nodeZ(i + 1))
        const on = i + 1 <= a
        ctx!.strokeStyle = on ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.18)'
        ctx!.lineWidth = 1
        ctx!.setLineDash(on ? [] : [3, 6])
        ctx!.beginPath(); ctx!.moveTo(x0, y0); ctx!.lineTo(x1, y1); ctx!.stroke()
      }
      ctx!.setLineDash([])

      // Governed aggregation boundary: a dashed upright ellipse between the two halves of the chain.
      const [bx, by] = proj((nx(boundaryAfter) + nx(boundaryAfter + 1)) / 2, (nodeY(boundaryAfter) + nodeY(boundaryAfter + 1)) / 2, 0)
      ctx!.strokeStyle = a > boundaryAfter ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)'
      ctx!.setLineDash([2, 5])
      ctx!.beginPath(); ctx!.ellipse(bx, by, U * 0.12, U * 0.55, 0, 0, Math.PI * 2); ctx!.stroke()
      ctx!.setLineDash([])

      // Other steps as dots with labels.
      ctx!.font = `11px ${family}`
      ctx!.textAlign = 'center'
      for (let i = 0; i < n; i++) {
        if (i === a) continue
        const [x, y] = proj(nx(i), nodeY(i), nodeZ(i))
        ctx!.beginPath(); ctx!.arc(x, y, 4.5, 0, Math.PI * 2)
        if (i < a) { ctx!.fillStyle = '#ffffff'; ctx!.fill() } else { ctx!.strokeStyle = 'rgba(255,255,255,0.45)'; ctx!.lineWidth = 1; ctx!.stroke() }
        ctx!.fillStyle = i < a ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)'
        ctx!.fillText(nodes[i], x, y + 20)
      }
      ctx!.fillStyle = 'rgba(255,255,255,0.45)'
      ctx!.fillText('GOVERNED BOUNDARY', bx, by - U * 0.55 - 10)

      // The active step as a glowing line drawing.
      const tgt = objs[target]
      const ox = nx(target), oy = nodeY(target), oz = nodeZ(target)
      // Gentle sway only, so flat symbols (compass, ID card) never turn edge-on.
      const yaw = reduced ? 0.15 : 0.15 + Math.sin(now / 2400) * 0.3
      const cyw = Math.cos(yaw), syw = Math.sin(yaw)
      const S = 1.05
      const pts: [number, number][] = new Array(K)
      for (let i = 0; i < K; i++) {
        const j = i * 3
        const x = from[j] + (tgt.p[j] - from[j]) * e + scatter[j] * burst
        const y = from[j + 1] + (tgt.p[j + 1] - from[j + 1]) * e + scatter[j + 1] * burst
        const z = from[j + 2] + (tgt.p[j + 2] - from[j + 2]) * e + scatter[j + 2] * burst
        cur[j] = x; cur[j + 1] = y; cur[j + 2] = z
        pts[i] = proj(ox + (x * cyw + z * syw) * S, oy + y * S, oz + (-x * syw + z * cyw) * S)
      }
      const starts = e < 0.5 ? fromStart : tgt.start
      const [gx, gy] = proj(ox, oy, oz)
      const glow = ctx!.createRadialGradient(gx, gy, 0, gx, gy, U * 0.9)
      glow.addColorStop(0, 'rgba(255,255,255,0.1)'); glow.addColorStop(1, 'rgba(255,255,255,0)')
      ctx!.fillStyle = glow
      ctx!.beginPath(); ctx!.arc(gx, gy, U * 0.9, 0, Math.PI * 2); ctx!.fill()
      const stroke = (width: number, style: string, blur: number) => {
        ctx!.lineWidth = width; ctx!.strokeStyle = style; ctx!.shadowColor = 'rgba(255,255,255,0.8)'; ctx!.shadowBlur = blur
        ctx!.beginPath()
        for (let i = 0; i < K; i++) {
          if (starts[i]) ctx!.moveTo(pts[i][0], pts[i][1])
          else ctx!.lineTo(pts[i][0], pts[i][1])
        }
        ctx!.stroke()
      }
      stroke(3, 'rgba(255,255,255,0.22)', 12)
      stroke(1.3, '#ffffff', 0)
      ctx!.shadowBlur = 0

      heat *= reduced ? 0 : Math.exp(-dt * 3.5)
      if (heat > 0.02) {
        const radius2 = (w < 640 ? 50 : 110) ** 2 * heat
        ctx!.font = `11px ${family}`
        ctx!.fillStyle = ACCENT
        for (let i = 0; i < K; i += 3) {
          const [x, y] = pts[i]
          if ((x - px) ** 2 + (y - py) ** 2 > radius2 || Math.random() < 0.35) continue
          ctx!.fillText(GLITCH[(Math.random() * GLITCH.length) | 0], x, y)
        }
      }
      ctx!.textAlign = 'start'
    }

    let raf = 0, last = performance.now(), running = false
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      draw(now, dt)
      if (running) raf = requestAnimationFrame(loop)
    }
    const start = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop) }
    const stop = () => { running = false; cancelAnimationFrame(raf) }

    resize()
    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      px = e.clientX - rect.left; py = e.clientY - rect.top
      heat = 1
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    const ro = new ResizeObserver(() => { resize(); if (!running) draw(performance.now(), 1) })
    ro.observe(canvas)
    const io = new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop()))
    io.observe(canvas)
    draw(performance.now(), 1)
    return () => { stop(); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', onPointer) }
  }, [nodes, boundaryAfter])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Capability graph: ${nodes.join(', then ')}. Currently at ${nodes[active]}.`}
      className="absolute inset-0 h-full w-full"
      style={{ fontFamily: 'var(--lx-mono)' }}
    />
  )
}

/* ── Section ─────────────────────────────────────────────────────────── */

export function GraphStage({ id, slides, nodes, boundaryAfter, backdrop, videos = [], stepBackgrounds = {} }: {
  id?: string
  slides: StageSlide[]
  nodes: string[]
  boundaryAfter: number
  backdrop?: ReactNode
  /** Real-life background video per step (same order as `slides`); crossfades as the step changes. */
  videos?: string[]
  /** Optional full-bleed background for a step (keyed by `word`), shown instead of that step's video. */
  stepBackgrounds?: Record<string, ReactNode>
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
  const background = stepBackgrounds[s.word]
  const showBackground = !!background

  return (
    <div id={id} ref={ref} style={{ height: `${slides.length * 80 + 30}vh` }}>
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {backdrop}
        {videos.length > 0 && (
          <>
            {Array.from(new Set(videos)).filter(Boolean).map(src => (
              <PixelVideo key={src} src={src} active={!showBackground && videos[active] === src} className="opacity-70" />
            ))}
            {/* A step background sits larger and dimmer than the video, under the darkening layer, so the text reads. */}
            {showBackground && (
              <div key={s.word} aria-hidden="true" className="lx-swap pointer-events-none absolute inset-0">
                {/* Dimming lives on an inner layer: lx-swap's fade-in animation would override opacity on the outer one. */}
                <div className="h-full w-full scale-[1.3] opacity-25 blur-[2px]">{background}</div>
              </div>
            )}
            {/* Darken evenly so white text reads on any footage, then fade the bottom for the graph strip. */}
            <div aria-hidden="true" className="absolute inset-0 bg-[#050506]/45" />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#050506] via-[#050506]/70 to-transparent" />
          </>
        )}

        <div className="relative flex h-full flex-col items-center px-4 pt-24 text-center md:px-8 md:pt-28">
          <div className="flex flex-col items-center gap-5">
            <div className="lx-mono flex flex-wrap items-center justify-center gap-3 text-white/60">
              The capability graph <span className="text-white/30">/</span>
              <span key={s.top} className="lx-swap text-white">{s.top}</span>
            </div>
            <div className="flex items-center gap-4" aria-hidden="true">
              <div className="flex gap-1.5">
                {slides.map((it, i) => (
                  <span key={it.word} className={`h-[3px] w-8 rounded-full transition-colors duration-500 md:w-12 ${i <= active ? 'bg-white' : 'bg-white/20'}`} />
                ))}
              </div>
              <span className="lx-mono text-white/60"><span className="text-white">{String(active + 1).padStart(2, '0')}</span> / {String(slides.length).padStart(2, '0')}</span>
            </div>
          </div>

          <div className="flex flex-1 items-center">
            <div key={s.word} className="lx-swap flex max-w-3xl flex-col items-center" aria-live="polite">
              <div className="lx-mono flex items-center gap-3 !text-[12px] text-white/65">
                <span>{s.label[0]}</span><span className="text-white/30">/</span><span>{s.word}</span>
              </div>
              <h3 className="mt-4 font-headline text-[clamp(40px,5.2vw,92px)] font-medium leading-[0.95] tracking-[-0.04em] text-white">{s.heading}</h3>
              <p className="lx-serif mt-4 text-[clamp(22px,2.2vw,32px)] leading-tight text-white/85">{s.subtitle}</p>
              <p className="mt-3 max-w-2xl text-[clamp(16px,1.25vw,19px)] leading-relaxed text-white/70">{s.body}</p>
            </div>
          </div>

          {/* The graph strip along the bottom, full bleed */}
          <div className="relative h-[34vh] min-h-[220px] w-[calc(100%+2rem)] md:w-[calc(100%+4rem)]">
            <GraphStrip nodes={nodes} active={active} boundaryAfter={boundaryAfter} />
          </div>
        </div>
      </div>
    </div>
  )
}
