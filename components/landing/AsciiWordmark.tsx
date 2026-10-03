'use client'

import { useEffect, useRef } from 'react'

const RAMP = '.:+*#'
const GLITCH = '01<>/\\|_#@%'

/** Giant wordmark drawn as characters. Glyphs near the pointer scramble into the accent colour. */
export default function AsciiWordmark({ text = 'SYRKA' }: { text?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const family = getComputedStyle(canvas).fontFamily

    let w = 0, h = 0, cw = 6, ch = 9, fs = 8, cols = 0, rows = 0
    let cover: Float32Array = new Float32Array(0)
    let accent = '#7a7aff'
    let px = -9999, py = -9999, heat = 0, raf = 0

    function build() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas!.getBoundingClientRect().width
      fs = w < 640 ? 6 : 9
      ctx!.font = `${fs}px ${family}`
      cw = ctx!.measureText('M').width
      ch = Math.round(fs * 1.2)
      cols = Math.floor(w / cw)
      if (cols < 1) { cover = new Float32Array(0); rows = 0; return }
      // Size the wordmark from its measured width so it spans the container.
      const off = document.createElement('canvas')
      const octx = off.getContext('2d')!
      octx.font = `700 100px 'Space Grotesk', sans-serif`
      const m = octx.measureText(text)
      const scale = (cols * 0.98) / m.width
      const textH = 100 * 0.74 * scale // cap height, in cells
      rows = Math.ceil((textH * cw) / ch) + 2
      h = rows * ch
      canvas!.style.height = `${h}px`
      canvas!.width = Math.round(w * dpr)
      canvas!.height = Math.round(h * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.font = `${fs}px ${family}`
      ctx!.textBaseline = 'top'

      // Rasterise at one pixel per cell, correcting for the cell aspect ratio.
      off.width = cols
      off.height = rows
      octx.setTransform(1, 0, 0, cw / ch, 0, 0)
      octx.fillStyle = '#fff'
      octx.font = `700 ${100 * scale}px 'Space Grotesk', sans-serif`
      octx.textBaseline = 'alphabetic'
      octx.fillText(text, (cols - m.width * scale) / 2, (rows * ch) / cw - (ch / cw) * 1.2)
      const data = octx.getImageData(0, 0, cols, rows).data
      cover = new Float32Array(cols * rows)
      for (let i = 0; i < cols * rows; i++) cover[i] = data[i * 4 + 3] / 255
      accent = getComputedStyle(canvas!).getPropertyValue('--lx-accent-ink').trim() || accent
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h)
      const radius2 = (w < 640 ? 50 : 110) ** 2
      for (let r = 0; r < rows; r++) {
        let ink = '', hot = ''
        for (let c = 0; c < cols; c++) {
          const v = cover[r * cols + c]
          if (v < 0.15) { ink += ' '; hot += ' '; continue }
          const d2 = (c * cw - px) ** 2 + (r * ch - py) ** 2
          if (heat > 0 && d2 < radius2 * heat && Math.random() > 0.25) {
            ink += ' '
            hot += GLITCH[(Math.random() * GLITCH.length) | 0]
          } else {
            ink += RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))]
            hot += ' '
          }
        }
        ctx!.fillStyle = 'rgba(237,237,237,0.78)'
        ctx!.fillText(ink, 0, r * ch)
        if (hot.trim()) { ctx!.fillStyle = accent; ctx!.fillText(hot, 0, r * ch) }
      }
    }

    function tick() {
      heat *= 0.93
      draw()
      raf = heat > 0.02 ? requestAnimationFrame(tick) : 0
      if (!raf) { heat = 0; draw() }
    }
    function onMove(e: PointerEvent) {
      if (reduced) return
      const rect = canvas!.getBoundingClientRect()
      px = e.clientX - rect.left; py = e.clientY - rect.top
      heat = 1
      if (!raf) raf = requestAnimationFrame(tick)
    }

    let alive = true
    document.fonts.ready.then(() => { if (alive) { build(); draw() } })
    const ro = new ResizeObserver(() => { build(); draw() })
    ro.observe(canvas.parentElement!)
    canvas.addEventListener('pointermove', onMove)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
    }
  }, [text])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={text}
      className="block w-full"
      style={{ fontFamily: 'var(--lx-mono)' }}
    />
  )
}
