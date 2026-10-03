'use client'

import { useEffect, useRef } from 'react'
import { isLand, type GlobeFit } from './AsciiGlobe'
import { seededRandom } from './seededRandom'
import { SYMBOL_LINES, SYMBOL_STROKE } from './brand'

/**
 * One 3D point cloud drawn in text characters, in Syrka blue-violet. It starts as the hero globe (cradled by the
 * Syrka symbol, as in AsciiGlobe), travels down with the reader and re-forms as the page changes:
 *
 *   globe → Syrka mark holding a crystal (intro slide) → mortarboard (developed) → compass (directed)
 *         → passport booklet (proven & carried) → briefcase (put to work) → government building (coordinated nationally)
 *
 * It lives in a sticky, viewport-sized layer spanning the hero and the scroller. It eases from the hero `fit` into
 * the scroller's `data-morph-anchor` box as the page scrolls, and the scroller's progress picks the slide shape.
 */

const N = 6000
const RAMP = '.:-=+*#%@'
const GLITCH = '01<>/\\|_'
// Deep blue → violet → lavender-white, dimmest first.
const COLORS = [
  'rgba(64,72,230,0.34)', 'rgba(82,90,255,0.5)', 'rgba(108,100,255,0.64)', 'rgba(136,112,255,0.76)',
  'rgba(166,132,255,0.86)', 'rgba(198,170,255,0.94)', 'rgba(232,224,255,1)',
]
const DEG = Math.PI / 180
const EMBLEM_RAMP = ':+#@'
/** Same accent the footer wordmark scrambles into (--lx-accent-ink on dark). */
const ACCENT = '#7a7aff'
/** Brushed-silver ink for the passport's symbol and chip mark. */
const SILVER = '#c9ced8'

interface Shape { p: Float32Array; w: Float32Array; s: Float32Array }
type Pt = [number, number, number, number] | [number, number, number, number, number] // x, y, z, weight, silver?
type V3 = [number, number, number]

/** Resample to exactly N points, ordered top-to-bottom so morphs sweep coherently instead of scrambling. */
function finish(pts: Pt[]): Shape {
  pts.sort((a, b) => b[1] - a[1] || a[0] - b[0])
  const p = new Float32Array(N * 3), w = new Float32Array(N), s = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const q = pts[Math.floor((i * pts.length) / N)]
    p[i * 3] = q[0]; p[i * 3 + 1] = q[1]; p[i * 3 + 2] = q[2]; w[i] = q[3]; s[i] = q[4] ?? 0
  }
  return { p, w, s }
}

/** Surface samplers sharing one point list and seeded generator. Faces are dim, edges and details bright. */
function builder(seed: number) {
  const rand = seededRandom(seed)
  const pts: Pt[] = []
  const add = (x: number, y: number, z: number, w: number) => { pts.push([x, y, z, w]) }
  /** Axis-aligned box centred on c with half-sizes h. */
  const box = (c: V3, h: V3, faceW: number, edgeW: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const u = rand() * 2 - 1, v = rand() * 2 - 1, sgn = rand() < 0.5 ? -1 : 1
      if (rand() < 0.62) {
        const f = Math.floor(rand() * 3)
        const q: V3 = f === 0 ? [sgn, u, v] : f === 1 ? [u, sgn, v] : [u, v, sgn]
        add(c[0] + q[0] * h[0], c[1] + q[1] * h[1], c[2] + q[2] * h[2], faceW)
      } else {
        const ax = Math.floor(rand() * 3), s2 = rand() < 0.5 ? -1 : 1
        const q: V3 = ax === 0 ? [u, sgn, s2] : ax === 1 ? [sgn, u, s2] : [sgn, s2, u]
        add(c[0] + q[0] * h[0], c[1] + q[1] * h[1], c[2] + q[2] * h[2], edgeW)
      }
    }
  }
  /** Vertical cylinder side from y0 to y1. */
  const cyl = (cx: number, cz: number, y0: number, y1: number, r: number, w: number, n: number) => {
    for (let i = 0; i < n; i++) { const t = rand() * Math.PI * 2; add(cx + Math.cos(t) * r, y0 + (y1 - y0) * rand(), cz + Math.sin(t) * r, w) }
  }
  /** Round tube along a polyline. */
  const tube = (path: V3[], r: number, w: number, n: number) => {
    const lens = path.slice(1).map((q, i) => Math.hypot(q[0] - path[i][0], q[1] - path[i][1], q[2] - path[i][2]))
    const total = lens.reduce((a, b) => a + b, 0)
    for (let i = 0; i < n; i++) {
      let d = rand() * total, k = 0
      while (k < lens.length - 1 && d > lens[k]) d -= lens[k++]
      const a = path[k], b = path[k + 1], u = d / (lens[k] || 1)
      const t = rand() * Math.PI * 2, rr = r * Math.sqrt(rand() * 0.3 + 0.7)
      add(a[0] + (b[0] - a[0]) * u + Math.cos(t) * rr, a[1] + (b[1] - a[1]) * u + Math.sin(t) * rr, a[2] + (b[2] - a[2]) * u + Math.sin(t + 1.3) * rr, w)
    }
  }
  /** Filled triangle at depth z. */
  const tri = (a: [number, number], b: [number, number], c: [number, number], z: number, w: number, n: number) => {
    for (let i = 0; i < n; i++) {
      let u = rand(), v = rand()
      if (u + v > 1) { u = 1 - u; v = 1 - v }
      add(a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v, a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v, z, w)
    }
  }
  const ball = (c: V3, r: number, w: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const t = rand() * Math.PI * 2, q = Math.acos(rand() * 2 - 1)
      add(c[0] + r * Math.sin(q) * Math.cos(t), c[1] + r * Math.cos(q), c[2] + r * Math.sin(q) * Math.sin(t), w)
    }
  }
  return { rand, pts, add, box, cyl, tube, tri, ball }
}

function globe(): Shape {
  const pts: Pt[] = []
  const M = 30000, ga = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < M; i++) {
    const y = 1 - (2 * (i + 0.5)) / M, r = Math.sqrt(1 - y * y), th = ga * i
    const x = r * Math.sin(th), z = r * Math.cos(th)
    const lat = Math.asin(y) / DEG, lon = Math.atan2(x, z) / DEG
    if (isLand(lat, lon)) pts.push([x, y, z, 1])
    else if (Math.abs(((lat + 360) % 15) - 7.5) > 7.1 || Math.abs(((lon + 720) % 15) - 7.5) > 7.2) pts.push([x, y, z, 0.05])
  }
  return finish(pts)
}

/** The Syrka symbol's two arms as tubes, holding a faceted crystal: the one shared record. */
function markCrystal(): Shape {
  const g = builder(13)
  const k = 1.02 / 38.4, S = 0.86, lift = 0.07
  const map = ([x, y]: [number, number]): V3 => [(x - 50) * k * S, (-(1.04 + (y - 61.6) * k) + lift) * S, 0]
  for (const line of SYMBOL_LINES) g.tube(line.map(map), 0.06, 1, 2400)
  // Icosahedron: bright edges, faint faces.
  const f = (1 + Math.sqrt(5)) / 2, r = 0.62 * S, cy = (0.12 + lift) * S
  const raw: V3[] = [[-1, f, 0], [1, f, 0], [-1, -f, 0], [1, -f, 0], [0, -1, f], [0, 1, f], [0, -1, -f], [0, 1, -f], [f, 0, -1], [f, 0, 1], [-f, 0, -1], [-f, 0, 1]]
  const norm = Math.hypot(1, f)
  const v = raw.map(([x, y, z]): V3 => [(x / norm) * r, (y / norm) * r + cy, (z / norm) * r])
  const edge = (2 / norm) * r * 1.01
  for (let i = 0; i < v.length; i++) {
    for (let j = i + 1; j < v.length; j++) {
      if (Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]) > edge) continue
      g.tube([v[i], v[j]], 0.012, 1, 70)
    }
  }
  for (let i = 0; i < 1400; i++) { // faint inner glow
    const t = g.rand() * Math.PI * 2, q = Math.acos(g.rand() * 2 - 1), rr = r * 0.8 * Math.cbrt(g.rand())
    g.add(rr * Math.sin(q) * Math.cos(t), cy + rr * Math.cos(q), rr * Math.sin(q) * Math.sin(t), 0.18)
  }
  g.ball([0, cy, 0], 0.07, 1, 160)
  return finish(g.pts)
}

/** Developed: a graduation cap. */
function mortarboard(): Shape {
  const g = builder(29)
  const board = builder(30)
  board.box([0, 0.34, 0], [0.62, 0.035, 0.62], 0.5, 1, 2600)
  // Turn the board 45° so it reads as a diamond, like a cap seen from the front.
  const c = Math.cos(45 * DEG), s = Math.sin(45 * DEG)
  for (const [x, y, z, w] of board.pts) g.add(x * c - z * s, y, x * s + z * c, w)
  g.cyl(0, 0, -0.28, 0.31, 0.46, 0.5, 1500)
  for (let i = 0; i < 300; i++) { const t = (i / 300) * Math.PI * 2; g.add(Math.cos(t) * 0.46, -0.28, Math.sin(t) * 0.46, 1) }
  g.ball([0, 0.4, 0], 0.05, 1, 120)
  g.tube([[0, 0.4, 0], [0.82, 0.38, 0.02], [0.84, -0.12, 0.04]], 0.018, 1, 420)
  for (let i = 0; i < 260; i++) { const t = g.rand() * Math.PI * 2, r = 0.07 * g.rand(); g.add(0.84 + Math.cos(t) * r, -0.12 - g.rand() * 0.2, 0.04 + Math.sin(t) * r, 0.9) }
  return finish(g.pts)
}

/** Directed: a compass, needle pointing up and to the right. */
function compass(): Shape {
  const g = builder(41)
  for (let i = 0; i < 1700; i++) { // bezel ring
    const u = g.rand() * Math.PI * 2, v = g.rand() * Math.PI * 2, R = 0.92, r = 0.06
    g.add((R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v), 1)
  }
  for (let i = 0; i < 700; i++) { const t = g.rand() * Math.PI * 2; g.add(Math.cos(t) * 0.95, Math.sin(t) * 0.95, -0.04 - g.rand() * 0.12, 0.45) }
  for (let i = 0; i < 700; i++) { const t = g.rand() * Math.PI * 2, r = 0.84 * Math.sqrt(g.rand()); g.add(Math.cos(t) * r, Math.sin(t) * r, -0.09, 0.14) }
  for (let k = 0; k < 24; k++) {
    const t = (k / 24) * Math.PI * 2, major = k % 6 === 0, r0 = major ? 0.6 : 0.73
    for (let i = 0; i < (major ? 50 : 22); i++) { const r = r0 + (0.84 - r0) * (i / (major ? 50 : 22)); g.add(Math.cos(t) * r, Math.sin(t) * r, -0.06, major ? 1 : 0.6) }
  }
  const a = 35 * DEG, ca = Math.cos(a), sa = Math.sin(a)
  const rot = (x: number, y: number): [number, number] => [x * ca + y * sa, -x * sa + y * ca]
  const L = 0.7, W = 0.13
  for (const z of [0.02, 0.06]) {
    g.tri(rot(0, L), rot(W, 0), rot(-W, 0), z, 1, 650)
    g.tri(rot(0, -L), rot(W, 0), rot(-W, 0), z, 0.42, 450)
  }
  g.ball([0, 0, 0.09], 0.06, 1, 140)
  return finish(g.pts)
}

/** Proven and carried: the Syrka ID (Career Passport) — seal, avatar, name, fields, QR and the reviewed badge. */
/**
 * Proven & carried: a passport booklet at real proportions (88 × 125 mm, portrait). The cover carries the Syrka
 * symbol at mid-height in silver; the "SYRKA / CAREER PASSPORT" title is typed beneath it at draw time
 * (PASSPORT_TITLE) so it stays legible as text. The page block shows along the opening edge.
 */
const PASSPORT_H = 0.82
const PASSPORT_W = PASSPORT_H * (88 / 125)
const PASSPORT_D = 0.045
/** The Syrka symbol on the cover: symbol units → cover coordinates, centred just above mid-height. */
const PASSPORT_LOGO_K = (PASSPORT_W * 1.55) / 76.8
const passportLogo = ([x, y]: [number, number]): [number, number] => [(x - 50) * PASSPORT_LOGO_K, 0.08 - (y - 49) * PASSPORT_LOGO_K]
/** Coverage → glyph for the cover symbol, faint edge to solid core. */
const LOGO_RAMP = '.:-=+*#%@'
/** Title lines typed under the symbol: [text, y on the cover]. */
const PASSPORT_TITLE: [string, number][] = [['S Y R K A', -0.24], ['CAREER PASSPORT', -0.36]]

function passport(): Shape {
  const rand = seededRandom(37), pts: Pt[] = []
  const W = PASSPORT_W, H = PASSPORT_H, D = PASSPORT_D, F = D + 0.012
  const add = (x: number, y: number, z: number, w: number, silver = 0) => { pts.push(silver ? [x, y, z, w, 1] : [x, y, z, w]) }
  // Cover boards: rounded outline front and back, faint front face, a slightly heavier spine on the left.
  const R = 0.035
  const outline = (u: number): [number, number] => {
    const sx = W - R, sy = H - R, L = [2 * sx, Math.PI * R / 2, 2 * sy, Math.PI * R / 2, 2 * sx, Math.PI * R / 2, 2 * sy, Math.PI * R / 2]
    let d = u * L.reduce((a, b) => a + b, 0), k = 0
    while (d > L[k]) d -= L[k++]
    const arcAt = (cx: number, cy: number, a0: number): [number, number] => { const t = a0 + d / R; return [cx + Math.cos(t) * R, cy + Math.sin(t) * R] }
    switch (k) {
      case 0: return [-sx + d, H]
      case 1: return arcAt(sx, sy, 0)
      case 2: return [W, sy - d]
      case 3: return arcAt(sx, -sy, -Math.PI / 2)
      case 4: return [sx - d, -H]
      case 5: return arcAt(-sx, -sy, Math.PI)
      case 6: return [-W, -sy + d]
      default: return arcAt(-sx, sy, Math.PI / 2)
    }
  }
  for (let i = 0; i < 1300; i++) { const [x, y] = outline(rand()); add(x, y, (rand() < 0.5 ? 1 : -1) * D, 0.9) }
  for (let i = 0; i < 700; i++) add((rand() * 2 - 1) * (W - 0.02), (rand() * 2 - 1) * (H - 0.02), D, 0.14)
  for (let i = 0; i < 260; i++) add(-W + rand() * 0.012, (rand() * 2 - 1) * H, (rand() * 2 - 1) * D, 0.8) // spine
  // Page block along the opening edge and the bottom: thin stacked lines between the boards.
  for (let i = 0; i < 520; i++) {
    const z = (Math.floor(rand() * 7) / 6 * 2 - 1) * D * 0.8
    if (rand() < 0.6) add(W - 0.01, (rand() * 2 - 1) * (H - 0.02), z, 0.45)
    else add((rand() * 2 - 1) * (W - 0.02), -H + 0.01, z, 0.45)
  }
  // The Syrka symbol, centred at mid-height, in silver.
  const map = (q: [number, number]): V3 => [...passportLogo(q), F]
  for (const line of SYMBOL_LINES) {
    const path = line.map(map)
    const lens = path.slice(1).map((q, i) => Math.hypot(q[0] - path[i][0], q[1] - path[i][1]))
    const total = lens.reduce((a, b) => a + b, 0)
    for (let i = 0; i < 1500; i++) {
      let d = rand() * total, j = 0
      while (j < lens.length - 1 && d > lens[j]) d -= lens[j++]
      const a = path[j], b = path[j + 1], u = d / (lens[j] || 1), t = rand() * Math.PI * 2, rr = 0.022 * Math.sqrt(rand())
      add(a[0] + (b[0] - a[0]) * u + Math.cos(t) * rr, a[1] + (b[1] - a[1]) * u + Math.sin(t) * rr, F, 1, 1)
    }
  }
  // Biometric chip mark near the foot of the cover, as on an e-passport.
  for (let i = 0; i < 160; i++) {
    const e = Math.floor(rand() * 4), u = rand(), x0 = -0.08, y0 = -0.685, w = 0.16, h = 0.08
    add(e === 0 ? x0 + u * w : e === 1 ? x0 + w : e === 2 ? x0 + u * w : x0, e === 0 ? y0 : e === 1 ? y0 + u * h : e === 2 ? y0 + h : y0 + u * h, F, 0.75, 1)
  }
  for (let i = 0; i < 70; i++) { const t = rand() * Math.PI * 2; add(Math.cos(t) * 0.024, -0.645 + Math.sin(t) * 0.024, F, 0.75, 1) }
  return finish(pts)
}

/** Put to work: a briefcase. */
function briefcase(): Shape {
  const g = builder(53)
  g.box([0, -0.14, 0], [0.82, 0.5, 0.24], 0.4, 1, 4200)
  g.tube([[-0.82, 0.12, 0.25], [0.82, 0.12, 0.25]], 0.012, 0.9, 380)
  for (const x of [-0.45, 0.45]) g.box([x, 0.12, 0.27], [0.07, 0.05, 0.03], 1, 1, 160)
  g.tube([[-0.28, 0.36, 0], [-0.28, 0.6, 0], [0.28, 0.6, 0], [0.28, 0.36, 0]], 0.045, 1, 900)
  return finish(g.pts)
}

/** Coordinated nationally: a civic building with steps, columns and a pediment. */
function civic(): Shape {
  const g = builder(71)
  g.box([0, -0.86, 0], [0.95, 0.05, 0.42], 0.4, 0.9, 700)
  g.box([0, -0.76, 0], [0.86, 0.05, 0.38], 0.4, 0.9, 600)
  g.box([0, -0.66, 0], [0.78, 0.05, 0.34], 0.4, 0.9, 500)
  for (let k = 0; k < 6; k++) g.cyl(-0.6 + k * 0.24, 0.2, -0.61, 0.22, 0.055, 0.85, 260)
  for (let k = 0; k < 4; k++) g.cyl(-0.42 + k * 0.28, -0.2, -0.61, 0.22, 0.055, 0.35, 150)
  g.box([0, 0.3, 0], [0.8, 0.08, 0.34], 0.5, 1, 900)
  g.tri([-0.84, 0.38], [0.84, 0.38], [0, 0.74], 0.3, 0.45, 600)
  g.tri([-0.84, 0.38], [0.84, 0.38], [0, 0.74], -0.3, 0.3, 300)
  g.tube([[-0.84, 0.38, 0.3], [0, 0.74, 0.3], [0.84, 0.38, 0.3], [-0.84, 0.38, 0.3]], 0.015, 1, 600)
  for (let i = 0; i < 700; i++) { // roof slopes
    const side = g.rand() < 0.5 ? -1 : 1, u = g.rand(), z = (g.rand() * 2 - 1) * 0.3
    g.add(side * 0.84 * (1 - u), 0.38 + 0.36 * u, z, 0.5)
  }
  return finish(g.pts)
}

function formatCoord(v: number, pos: string, neg: string) {
  const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60)
  return `${String(d).padStart(2, '0')}°${String(m).padStart(2, '0')}'${v >= 0 ? pos : neg}`
}

interface Props {
  /** Hero placement, as for AsciiGlobe. */
  fit: GlobeFit
  fitMobile: GlobeFit
  /** Id of the CapabilityScroller root; its progress picks the stage shape. */
  scrollerId: string
  /** Element whose text tracks the globe's facing lat/lon. */
  coordsId?: string
}

export default function MorphField({ fit, fitMobile, scrollerId, coordsId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const family = getComputedStyle(canvas).fontFamily
    const coordsEl = coordsId ? document.getElementById(coordsId) : null
    const stage = canvas.parentElement!
    const hero = stage.parentElement?.querySelector('section') ?? null

    // 0 globe (hero), then one per scroller slide: 1 the intro, 2… the stages.
    const shapes = [globe(), markCrystal(), mortarboard(), compass(), passport(), briefcase(), civic()]
    const SLIDES = shapes.length - 1
    const PASSPORT_SHAPE = 4
    const scatter = Float32Array.from({ length: N * 3 }, seededRandom(91)).map(v => v * 2 - 1)
    const glitchSeed = Float32Array.from({ length: N }, seededRandom(5))

    const from = new Float32Array(shapes[0].p), fromW = new Float32Array(shapes[0].w), fromS = new Float32Array(shapes[0].s)
    const cur = new Float32Array(shapes[0].p), curW = new Float32Array(shapes[0].w), curS = new Float32Array(shapes[0].s)
    let target = 0, morphStart = -1e9
    const MORPH = reduced ? 1 : 1100

    let w = 0, h = 0, fs = 11, cw = 7, ch = 14, cols = 0, rows = 0
    let depth = new Float32Array(0), lum = new Float32Array(0), silv = new Float32Array(0)
    // The passport's cover symbol, rasterised straight into the character grid each frame so it stays crisp.
    const logoCanvas = document.createElement('canvas')
    const lctx = logoCanvas.getContext('2d', { willReadFrequently: true })!
    let logoCov = new Uint8ClampedArray(0), logoHalo = new Uint8ClampedArray(0)
    let yaw = 0, lastCoords = 0
    // Emblem coverage per cell, a dilated "keep clear" halo, and the placement they were built for.
    let mark = new Float32Array(0), clear = new Uint8Array(0), emblemKey = ''
    let emblemA = 1
    // Pointer reaction, as on the footer wordmark: glyphs near the pointer scramble into the accent colour.
    let px = -9999, py = -9999, heat = 0

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth; h = window.innerHeight
      canvas!.width = Math.round(w * dpr); canvas!.height = Math.round(h * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      fs = w < 768 ? 9 : 11
      ctx!.font = `${fs}px ${family}`
      ctx!.textBaseline = 'top'
      cw = ctx!.measureText('M').width || 7 // fallback if font not loaded
      ch = Math.round(fs * 1.28)
      cols = Math.max(1, Math.ceil(w / cw)); rows = Math.max(1, Math.ceil(h / ch))
      depth = new Float32Array(cols * rows); lum = new Float32Array(cols * rows); silv = new Float32Array(cols * rows)
      emblemKey = ''
    }

    /** Rasterise the Syrka symbol into the character grid under a globe at (cx, cy, R). */
    function buildEmblem(cx: number, cy: number, R: number) {
      const key = `${Math.round(cx)},${Math.round(cy)},${Math.round(R)},${cols},${rows}`
      if (key === emblemKey) return
      emblemKey = key
      const off = document.createElement('canvas')
      off.width = cols; off.height = rows
      const o = off.getContext('2d', { willReadFrequently: true })!
      // Symbol units → pixels: its arms span ±1.02R, and its meeting point sits just under the globe.
      const sc = (R * 1.02) / 38.4
      const toX = (x: number) => cx + (x - 50) * sc
      const toY = (y: number) => cy + R * 1.04 + (y - 61.6) * sc
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
      const halo = pass(SYMBOL_STROKE * sc * 1.9)
      clear = new Uint8Array(cols * rows)
      for (let i = 0; i < cols * rows; i++) clear[i] = halo[i * 4 + 3] > 40 ? 1 : 0
      const ink = pass(Math.max(SYMBOL_STROKE * sc * 0.85, ch * 0.95))
      mark = new Float32Array(cols * rows)
      for (let i = 0; i < cols * rows; i++) mark[i] = ink[i * 4 + 3] / 255
    }

    const smooth = (u: number) => u * u * (3 - 2 * u)
    const clamp01 = (u: number) => Math.min(1, Math.max(0, u))

    /**
     * Placement and shape for the current scroll: eases from the hero fit into the scroller's anchor between the top
     * of the page and the moment the scroller pins, so the object appears to travel down as the content scrolls up.
     */
    function layout() {
      const sy = window.scrollY
      const f = w < 768 ? fitMobile : fit
      const heroTop = hero?.getBoundingClientRect().top ?? -sy
      const T0 = { x: w * f.cx, y: heroTop + h * f.cy, r: Math.min(w, h) * f.r }
      const anchor = document.querySelector<HTMLElement>('[data-morph-anchor]')
      const scroller = document.getElementById(scrollerId)
      if (!anchor || !scroller) return { ...T0, shape: 0 }
      const ar = anchor.getBoundingClientRect(), sr = scroller.getBoundingClientRect()
      const T1 = { x: ar.left + ar.width / 2, y: ar.top + ar.height / 2, r: Math.min(ar.width * 0.5, ar.height * 0.46) }
      const u = clamp01(sy / Math.max(1, sr.top + sy))
      const e = smooth(u)
      let shape = u < 0.5 ? 0 : 1
      if (sr.top <= 0) shape = 1 + Math.min(SLIDES - 1, Math.floor(clamp01(-sr.top / Math.max(1, sr.height - h)) * SLIDES))
      return { x: T0.x + (T1.x - T0.x) * e, y: T0.y + (T1.y - T0.y) * e, r: T0.r + (T1.r - T0.r) * e, shape }
    }

    function retarget(next: number, now: number) {
      if (next === target) return
      from.set(cur); fromW.set(curW); fromS.set(curS)
      target = next; morphStart = now
    }

    function frame(now: number, dt: number) {
      const { x: cx, y: cy, r: R, shape } = layout()
      retarget(shape, now)
      const tgt = shapes[target]
      const t = Math.min(1, (now - morphStart) / MORPH)
      const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
      const burst = Math.sin(Math.PI * t) * 0.32

      // The globe turns steadily; every other shape faces the reader and sways so it stays legible.
      if (target === 0) yaw += reduced ? 0 : dt * 0.09
      else {
        const sway = reduced ? 0 : Math.sin(now / 1900) * (target === PASSPORT_SHAPE ? 0.28 : 0.6)
        const d = ((((sway - yaw + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI
        yaw += d * (reduced ? 1 : Math.min(1, dt * 2.5))
      }
      const tilt = target === 0 ? -22 * DEG : -10 * DEG + Math.sin(now / 2600) * 0.06
      const cs = Math.cos(yaw), sn = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt)
      const L = [-0.45, 0.55, 0.7]

      depth.fill(-1e9); lum.fill(0); silv.fill(0)
      for (let i = 0; i < N; i++) {
        const j = i * 3
        let x = from[j] + (tgt.p[j] - from[j]) * e + scatter[j] * burst
        let y = from[j + 1] + (tgt.p[j + 1] - from[j + 1]) * e + scatter[j + 1] * burst
        let z = from[j + 2] + (tgt.p[j + 2] - from[j + 2]) * e + scatter[j + 2] * burst
        const wt = fromW[i] + (tgt.w[i] - fromW[i]) * e
        cur[j] = x; cur[j + 1] = y; cur[j + 2] = z
        curW[i] = wt
        const sv = fromS[i] + (tgt.s[i] - fromS[i]) * e
        curS[i] = sv
        // Spin about y, then tilt about x.
        const rx = x * cs + z * sn, rz = -x * sn + z * cs
        x = rx; z = rz
        const ry = y * ct - z * st; z = y * st + z * ct; y = ry
        const persp = 3.4 / (3.4 - z)
        const col = Math.floor((cx + x * R * persp) / cw), row = Math.floor((cy - y * R * persp) / ch)
        if (col < 0 || row < 0 || col >= cols || row >= rows) continue
        const len = Math.hypot(x, y, z) || 1
        const light = Math.max(0, (x * L[0] + y * L[1] + z * L[2]) / len)
        // Sphere-style shading suits the globe; other shapes are not spheres, so they light by weight (edges and
        // details bright, faces dim) with only a touch of directional light.
        const shade = target === 0 ? 0.12 + 0.72 * light : 0.62 + 0.3 * light
        const b = shade * (0.35 + 0.65 * wt) * (0.55 + 0.45 * (z + 1) / 2)
        const k = row * cols + col
        if (z > depth[k]) depth[k] = z
        lum[k] = Math.max(lum[k], b) + 0.015
        if (sv > silv[k]) silv[k] = sv
      }

      // The cover symbol: project its strokes with the booklet's pose and stroke them at cell resolution — a wide
      // pass clears a margin around it, a narrower one sets the glyph coverage.
      let logoA = 0
      if (target === PASSPORT_SHAPE) logoA = Math.max(0, Math.min(1, (e - 0.45) / 0.4))
      if (logoA > 0) {
        if (logoCanvas.width !== cols || logoCanvas.height !== rows) { logoCanvas.width = cols; logoCanvas.height = rows }
        const proj = (q: [number, number]): [number, number] => {
          let [x, y] = passportLogo(q), z = PASSPORT_D + 0.012
          const rx = x * cs + z * sn, rz = -x * sn + z * cs
          x = rx; z = rz
          const ry = y * ct - z * st; z = y * st + z * ct; y = ry
          const persp = 3.4 / (3.4 - z)
          return [cx + x * R * persp, cy - y * R * persp]
        }
        const lines = SYMBOL_LINES.map(l => l.map(proj))
        const stroke = (width: number) => {
          lctx.setTransform(1, 0, 0, 1, 0, 0)
          lctx.clearRect(0, 0, cols, rows)
          lctx.setTransform(1 / cw, 0, 0, 1 / ch, 0, 0)
          lctx.strokeStyle = '#fff'; lctx.lineCap = 'round'; lctx.lineJoin = 'round'; lctx.lineWidth = width
          for (const l of lines) { lctx.beginPath(); l.forEach(([x, y], i) => (i ? lctx.lineTo(x, y) : lctx.moveTo(x, y))); lctx.stroke() }
          return lctx.getImageData(0, 0, cols, rows).data
        }
        const ink = Math.max(ch * 2, SYMBOL_STROKE * PASSPORT_LOGO_K * R * 3.2)
        logoHalo = stroke(ink + ch * 1.1)
        logoCov = stroke(ink)
      }

      // The passport's title, typed in silver under the symbol once the booklet has formed.
      const titleCells = new Map<number, string>()
      const titleA = target === PASSPORT_SHAPE ? Math.max(0, Math.min(1, (e - 0.6) / 0.4)) : 0
      if (titleA > 0) {
        for (const [text, ty] of PASSPORT_TITLE) {
          let x = 0, y = ty, z = PASSPORT_D + 0.012
          const rx = x * cs + z * sn, rz = -x * sn + z * cs
          x = rx; z = rz
          const ry = y * ct - z * st; z = y * st + z * ct; y = ry
          const persp = 3.4 / (3.4 - z)
          const row = Math.floor((cy - y * R * persp) / ch)
          const c0 = Math.round((cx + x * R * persp) / cw - text.length / 2)
          if (row < 0 || row >= rows) continue
          // Clear a cell either side so the letters sit on a clean band of the cover.
          for (let c = -1; c <= text.length; c++) {
            const col = c0 + c
            if (col >= 0 && col < cols) titleCells.set(row * cols + col, text[c] ?? ' ')
          }
        }
      }

      emblemA += ((target === 0 ? 1 : 0) - emblemA) * (reduced ? 1 : Math.min(1, dt * 5))
      const showEmblem = emblemA > 0.02
      if (showEmblem) buildEmblem(cx, cy, R)

      heat *= reduced ? 0 : Math.exp(-dt * 3.5)
      const radius2 = (w < 640 ? 60 : 130) ** 2 * heat

      ctx!.clearRect(0, 0, w, h)
      const line: string[][] = COLORS.map(() => [])
      const emblemLine: string[] = []
      const hotLine: string[] = []
      const silverLine: string[] = []
      const logoLine: string[] = []
      const titleLine: string[] = []
      for (let r = 0; r < rows; r++) {
        let any = false
        for (const l of line) { l.length = cols; l.fill(' ') }
        emblemLine.length = cols; emblemLine.fill(' ')
        hotLine.length = cols; hotLine.fill(' ')
        silverLine.length = cols; silverLine.fill(' ')
        logoLine.length = cols; logoLine.fill(' ')
        titleLine.length = cols; titleLine.fill(' ')
        const dy2 = (r * ch + ch / 2 - py) ** 2
        for (let c = 0; c < cols; c++) {
          const k0 = r * cols + c
          const hot = heat > 0.02 && (c * cw + cw / 2 - px) ** 2 + dy2 < radius2 && Math.random() > 0.25
          if (showEmblem) {
            const m = mark[k0]
            if (m > 0.25) {
              if (hot) { hotLine[c] = GLITCH[(Math.random() * GLITCH.length) | 0]; any = true; continue }
              let g = EMBLEM_RAMP[Math.min(EMBLEM_RAMP.length - 1, Math.floor(m * EMBLEM_RAMP.length))]
              if (!reduced && Math.random() < 0.01) g = GLITCH[(Math.random() * GLITCH.length) | 0]
              emblemLine[c] = g
              any = true
              continue
            }
            if (clear[k0] && emblemA > 0.5) continue
          }
          const title = titleCells.get(k0)
          if (title !== undefined) { titleLine[c] = title; any = true; continue }
          if (logoA > 0) {
            const cov = logoCov[k0 * 4 + 3] / 255
            if (cov > 0.06) {
              logoLine[c] = hot ? GLITCH[(Math.random() * GLITCH.length) | 0] : LOGO_RAMP[Math.min(LOGO_RAMP.length - 1, Math.floor(cov * LOGO_RAMP.length))]
              any = true
              continue
            }
            if (logoHalo[k0 * 4 + 3] > 40 && logoA > 0.5) continue
          }
          const v = lum[k0]
          if (!v) continue
          any = true
          if (hot) { hotLine[c] = GLITCH[(Math.random() * GLITCH.length) | 0]; continue }
          const b = Math.min(0.999, v)
          let g = RAMP[Math.floor(b * RAMP.length)]
          if (!reduced && Math.random() < 0.006 + burst * 0.05) g = GLITCH[(glitchSeed[(r * cols + c) % N] * 1e4 + now / 60 | 0) % GLITCH.length]
          if (silv[k0] > 0.5) silverLine[c] = g
          else line[Math.min(COLORS.length - 1, Math.floor(b * COLORS.length))][c] = g
        }
        if (!any) continue
        if (showEmblem) {
          const s = emblemLine.join('')
          if (s.trim()) { ctx!.fillStyle = `rgba(236,236,240,${0.82 * emblemA})`; ctx!.fillText(s, 0, r * ch) }
        }
        for (let k = 0; k < COLORS.length; k++) {
          const s = line[k].join('')
          if (!s.trim()) continue
          ctx!.fillStyle = COLORS[k]
          ctx!.fillText(s, 0, r * ch)
        }
        const ss = silverLine.join('')
        if (ss.trim()) { ctx!.fillStyle = SILVER; ctx!.fillText(ss, 0, r * ch) }
        const ls = logoLine.join('')
        if (ls.trim()) { ctx!.fillStyle = `rgba(214,219,228,${logoA})`; ctx!.fillText(ls, 0, r * ch) }
        const ts = titleLine.join('')
        if (ts.trim()) { ctx!.fillStyle = `rgba(222,226,234,${titleA})`; ctx!.fillText(ts, 0, r * ch) }
        const hs = hotLine.join('')
        if (hs.trim()) { ctx!.fillStyle = ACCENT; ctx!.fillText(hs, 0, r * ch) }
      }

      if (coordsEl && target === 0 && now - lastCoords > 120) {
        lastCoords = now
        const lon = ((((-yaw / DEG + 20 + 180) % 360) + 360) % 360) - 180
        coordsEl.textContent = `${formatCoord(22, 'N', 'S')}, ${formatCoord(lon, 'E', 'W')}`
      }
    }

    let raf = 0, last = performance.now(), running = false
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      frame(now, dt)
      if (running) raf = requestAnimationFrame(loop)
    }
    const start = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop) }
    const stop = () => { running = false; cancelAnimationFrame(raf) }

    resize()
    document.fonts.ready.then(() => resize())
    window.addEventListener('resize', resize)
    const io = new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop()))
    io.observe(stage.parentElement ?? stage)
    // Reduced motion: no animation loop, but still redraw on scroll so the shape follows the stage.
    const onScroll = () => { if (reduced) frame(performance.now(), 0) }
    window.addEventListener('scroll', onScroll, { passive: true })
    // The layer ignores pointer events (it sits over the text), so listen on the window and map into the canvas.
    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      px = e.clientX - rect.left; py = e.clientY - rect.top
      heat = 1
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    frame(performance.now(), 0)

    return () => {
      stop(); io.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [fit, fitMobile, scrollerId, coordsId])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full transition-opacity duration-500"
      style={{ fontFamily: 'var(--lx-mono)' }}
    />
  )
}
