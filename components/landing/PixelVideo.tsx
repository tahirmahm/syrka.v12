'use client'

import { useEffect, useRef } from 'react'

/**
 * A looping, muted background video shown as an LED-style pixel image: each frame is drawn into a canvas at
 * 1/`block` resolution (cover-fitted), scaled back up with hard edges, and overlaid with a fine dark grid.
 * Frames are only drawn while the video is on screen and `active`; otherwise the video is paused.
 */
export default function PixelVideo({ src, active = true, block = 4, className = '' }: {
  src: string
  active?: boolean
  /** Size of one pixel block in CSS px. */
  block?: number
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
    const v = videoRef.current
    if (!v) return
    if (active) v.play().catch(() => {})
    else v.pause()
  }, [active])

  useEffect(() => {
    const video = videoRef.current, canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { alpha: false })
    if (!video || !canvas || !ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(r.width / block))
      canvas.height = Math.max(1, Math.round(r.height / block))
      ctx.imageSmoothingEnabled = true
    }
    const draw = () => {
      if (!video.videoWidth) return
      // object-fit: cover
      const cw = canvas.width, ch = canvas.height
      const s = Math.max(cw / video.videoWidth, ch / video.videoHeight)
      const dw = video.videoWidth * s, dh = video.videoHeight * s
      ctx.drawImage(video, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
    }

    let raf = 0, visible = false
    const loop = () => {
      raf = 0
      if (!visible || !activeRef.current) return
      draw()
      raf = requestAnimationFrame(loop)
    }
    const kick = () => { if (!raf && visible && activeRef.current) raf = requestAnimationFrame(loop) }

    resize()
    const ro = new ResizeObserver(() => { resize(); draw() })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && activeRef.current && !reduced) { video.play().catch(() => {}); kick() }
      else video.pause()
    })
    io.observe(canvas)
    video.addEventListener('loadeddata', draw)
    video.addEventListener('play', kick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect(); io.disconnect()
      video.removeEventListener('loadeddata', draw)
      video.removeEventListener('play', kick)
    }
  }, [block])

  return (
    // Outer layer fades with `active`; `className` (e.g. a base opacity) goes on the inner one so the two don't clash.
    <div aria-hidden="true" className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}>
      {/* Kept in the layout (not display:none) so every browser keeps decoding it. */}
      <video ref={videoRef} src={src} muted loop playsInline preload="auto" className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0" />
      <div className={`absolute inset-0 ${className}`}>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} />
        {/* LED grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.38) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.38) 1px, transparent 1px)',
            backgroundSize: `${block}px ${block}px`,
          }}
        />
      </div>
    </div>
  )
}
