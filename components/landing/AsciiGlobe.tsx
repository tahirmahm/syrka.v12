'use client'

import { useEffect, useRef } from 'react'
import { LAND_MASK_B64, LAND_MASK_H, LAND_MASK_W } from '@/lib/landmask'
import { SYMBOL_LINES, SYMBOL_STROKE } from './brand'

/** Globe placement as fractions of the canvas: centre x/y, and radius as a fraction of the shorter side. */
export interface GlobeFit { cx: number; cy: number; r: number }

interface Props {
  fit?: GlobeFit
  fitMobile?: GlobeFit
  /** Draw the Syrka symbol cradling the globe, in characters. */
  emblem?: boolean
  /** Assemble the globe character by character when it first appears. */
  reveal?: boolean
  /** Element whose text is kept in sync with the lat/lon facing the viewer. */
  coordsId?: string
  className?: string
}

const DEG = Math.PI / 180
const LAND_RAMP = '.:-=+*#%@'
const EMBLEM_RAMP = ':+#@'
const GLITCH = '01<>/\\|_'
// Grey ramp per brightness bucket; the last bucket is the emblem.
const ALPHAS = [0.08, 0.15, 0.24, 0.36, 0.5, 0.68]
const EMBLEM = ALPHAS.length
// Syrka blue → violet as land gets brighter; alpha follows ALPHAS (boosted a little, colour reads darker than grey).
const TINTS = ALPHAS.map((a, i) => {
  const k = i / (ALPHAS.length - 1)
  return `rgba(${Math.round(82 + 120 * k)},${Math.round(90 + 80 * k)},255,${Math.min(1, a * 1.45)})`
})
const DEFAULT_FIT: GlobeFit = { cx: 0.5, cy: 0.55, r: 0.44 }
const DEFAULT_FIT_MOBILE: GlobeFit = { cx: 0.5, cy: 0.47, r: 0.4 }

let landBits: Uint8Array | null = null
export function isLand(lat: number, lon: number) {
  if (!landBits) landBits = Uint8Array.from(atob(LAND_MASK_B64), c => c.charCodeAt(0))
  const y = Math.min(LAND_MASK_H - 1, Math.max(0, Math.round(89.5 - lat)))
  const x = ((Math.round(lon + 179.5) % LAND_MASK_W) + LAND_MASK_W) % LAND_MASK_W
  const i = y * LAND_MASK_W + x
  return (landBits[i >> 3] >> (i & 7)) & 1
}

function formatCoord(v: number, pos: string, neg: string) {
  const a = Math.abs(v)
  const d = Math.floor(a)
  const m = Math.floor((a - d) * 60)
  return `${String(d).padStart(2, '0')}°${String(m).padStart(2, '0')}'${v >= 0 ? pos : neg}`
}

export default function AsciiGlobe({ fit = DEFAULT_FIT, fitMobile = DEFAULT_FIT_MOBILE, emblem = false, reveal = false, coordsId, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coordsEl = coordsId ? document.getElementById(coordsId) : null
    const family = getComputedStyle(canvas).fontFamily

    let w = 0, h = 0, fs = 12, cw = 7, ch = 15, cols = 0, rows = 0
    let cx = 0, cy = 0, R = 0
    // Emblem coverage per cell, and a dilated "keep clear" mask so the symbol reads against the globe.
    let mark = new Float32Array(0)
    let clear = new Uint8Array(0)
    // Per-cell random threshold for the assembling reveal.
    let seed = new Float32Array(0)
    const t0 = performance.now()

    let lon0 = 20, lat0 = 22
    const spin = reduced ? 0 : 5 // deg per second
    let dragging = false, lastX = 0, lastY = 0, velLon = 0, velLat = 0

    function buildEmblem() {
      mark = new Float32Array(cols * rows)
      clear = new Uint8Array(cols * rows)
      if (!emblem) return
      const off = document.createElement('canvas')
      off.width = cols; off.height = rows
      const o = off.getContext('2d', { willReadFrequently: true })!
      // Symbol units → pixels: its arms span ±1.02R, and its meeting point sits just under the globe.
      const s = (R * 1.02) / 38.4
      const toX = (x: number) => cx + (x - 50) * s
      const toY = (y: number) => cy + R * 1.04 + (y - 61.6) * s
      const pass = (width: number) => {
        o.setTransform(1, 0, 0, 1, 0, 0)
        o.clearRect(0, 0, cols, rows)
        o.setTransform(1 / cw, 0, 0, 1 / ch, 0, 0)
        o.strokeStyle = '#fff'
        o.lineCap = 'round'; o.lineJoin = 'round'
        o.lineWidth = width
        for (const pts of SYMBOL_LINES) {
          o.beginPath()
          pts.forEach(([x, y], i) => (i ? o.lineTo(toX(x), toY(y)) : o.moveTo(toX(x), toY(y))))
          o.stroke()
        }
        return o.getImageData(0, 0, cols, rows).data
      }
      const halo = pass(SYMBOL_STROKE * s * 1.9)
      for (let i = 0; i < cols * rows; i++) clear[i] = halo[i * 4 + 3] > 40 ? 1 : 0
      const ink = pass(Math.max(SYMBOL_STROKE * s * 0.85, ch * 0.95))
      for (let i = 0; i < cols * rows; i++) mark[i] = ink[i * 4 + 3] / 255
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas!.getBoundingClientRect()
      w = rect.width; h = rect.height
      if (w < 1 || h < 1) return
      canvas!.width = Math.round(w * dpr)
      canvas!.height = Math.round(h * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      const mobile = w < 768
      fs = mobile ? 9 : 11
      ctx!.font = `${fs}px ${family}`
      ctx!.textBaseline = 'top'
      cw = ctx!.measureText('M').width
      ch = Math.round(fs * 1.28)
      cols = Math.ceil(w / cw)
      rows = Math.ceil(h / ch)
      const f = mobile ? fitMobile : fit
      R = Math.min(w, h) * f.r
      cx = w * f.cx
      cy = h * f.cy
      seed = Float32Array.from({ length: cols * rows }, () => Math.random())
      buildEmblem()
    }

    const buckets: string[][] = Array.from({ length: ALPHAS.length + 1 }, () => [])

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h)
      const sLat0 = Math.sin(lat0 * DEG), cLat0 = Math.cos(lat0 * DEG)
      // 0 → 1 over ~1.4s: cells switch on in random order, the emblem last.
      const shown = reveal && !reduced ? Math.min(1.2, (t - t0) / 1400) : 2

      for (let r = 0; r < rows; r++) {
        for (const b of buckets) { b.length = cols; b.fill(' ') }
        const py = r * ch + ch / 2
        const ny = (py - cy) / R
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          if (seed[i] > shown) continue
          const m = mark[i]
          if (m > 0.25) {
            if (shown < 1 && seed[i] > shown - 0.2) continue
            let glyph = EMBLEM_RAMP[Math.min(EMBLEM_RAMP.length - 1, Math.floor(m * EMBLEM_RAMP.length))]
            if (!reduced && Math.random() < 0.01) glyph = GLITCH[(Math.random() * GLITCH.length) | 0]
            buckets[EMBLEM][c] = glyph
            continue
          }
          if (clear[i]) continue
          const px = c * cw + cw / 2
          const nx = (px - cx) / R
          const d2 = nx * nx + ny * ny
          if (d2 > 1) {
            if (d2 < 1.06 && (c + r) % 2 === 0) buckets[0][c] = '.'
            continue
          }
          const x = nx, y = -ny, z = Math.sqrt(1 - d2)
          const lat = Math.asin(y * cLat0 + z * sLat0) / DEG
          const lon = lon0 + Math.atan2(x, z * cLat0 - y * sLat0) / DEG
          if (isLand(lat, lon)) {
            const light = Math.max(0, x * -0.45 + y * 0.55 + z * 0.7)
            const b = Math.min(0.999, 0.18 + 0.82 * light)
            let glyph = LAND_RAMP[Math.floor(b * LAND_RAMP.length)]
            if (!reduced && Math.random() < 0.012) glyph = GLITCH[(Math.random() * GLITCH.length) | 0]
            buckets[1 + Math.min(ALPHAS.length - 2, Math.floor(b * (ALPHAS.length - 1)))][c] = glyph
          } else {
            // Ocean: graticule every 15° plus a sparse dot field for the sphere shape.
            const onGrid = Math.abs(((lat + 360) % 15) - 7.5) > 7.0 || Math.abs(((lon + 720) % 15) - 7.5) > 7.1
            if (onGrid) buckets[z > 0.35 ? 1 : 0][c] = '·'
            else if ((c + r) % 3 === 0) buckets[0][c] = '.'
          }
        }
        const y = r * ch
        for (let b = 0; b < buckets.length; b++) {
          const line = buckets[b].join('')
          if (!line.trim()) continue
          ctx!.fillStyle = b === EMBLEM ? 'rgba(236,236,240,0.82)' : TINTS[b]
          ctx!.fillText(line, 0, y)
        }
      }
    }

    let raf = 0, last = performance.now(), lastCoords = 0, running = false
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!dragging) {
        lon0 -= spin * dt + velLon
        lat0 = Math.max(-60, Math.min(70, lat0 + velLat))
        velLon *= 0.94; velLat *= 0.94
        lat0 += (22 - lat0) * 0.008
      }
      draw(now)
      if (coordsEl && now - lastCoords > 120) {
        lastCoords = now
        const lon = ((((lon0 + 180) % 360) + 360) % 360) - 180
        coordsEl.textContent = `${formatCoord(lat0, 'N', 'S')}, ${formatCoord(lon, 'E', 'W')}`
      }
      if (running) raf = requestAnimationFrame(frame)
    }
    function start() {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    function stop() { running = false; cancelAnimationFrame(raf) }

    function onDown(e: PointerEvent) {
      dragging = true; lastX = e.clientX; lastY = e.clientY
      canvas!.setPointerCapture(e.pointerId)
      if (reduced) start()
    }
    function onMove(e: PointerEvent) {
      if (!dragging) return
      const k = 90 / R
      const dx = (e.clientX - lastX) * k, dy = (e.clientY - lastY) * k
      lon0 -= dx; lat0 = Math.max(-60, Math.min(70, lat0 + dy))
      velLon = -dx * 0.5; velLat = dy * 0.5
      lastX = e.clientX; lastY = e.clientY
    }
    function onUp() {
      dragging = false
      if (reduced) { stop(); draw(performance.now()) }
    }

    let alive = true
    resize()
    // The emblem's cell grid depends on the mono font's metrics; rebuild once fonts settle.
    document.fonts.ready.then(() => { if (alive) { resize(); if (!running) draw(performance.now()) } })
    const ro = new ResizeObserver(() => { resize(); if (!running) draw(performance.now()) })
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !reduced) start()
      else stop()
    })
    io.observe(canvas)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    frame(performance.now())

    return () => {
      alive = false
      stop(); ro.disconnect(); io.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
  }, [fit, fitMobile, emblem, reveal, coordsId])

  return (
    <canvas
      ref={canvasRef}
      aria-label="Rotating globe drawn in text characters. Drag to rotate."
      role="img"
      className={`absolute inset-0 h-full w-full cursor-grab touch-pan-y active:cursor-grabbing ${className ?? ''}`}
      style={{ fontFamily: 'var(--lx-mono)' }}
    />
  )
}
