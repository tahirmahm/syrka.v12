import Image from 'next/image'

/**
 * The Syrka symbol as two polylines in a 0–100 space (traced from public/brand/syrka-symbol-original.jpg).
 * Shared by the SVG mark and the canvases that draw it in characters, so every rendering stays identical.
 */
export const SYMBOL_LINES: [number, number][][] = [
  [[11.6, 32.6], [47.9, 59.6], [47.9, 61.6], [43.4, 65.3]],
  [[88.4, 32.6], [52.1, 59.6], [52.1, 61.6], [56.6, 65.3]],
]
export const SYMBOL_STROKE = 3.2
/** Fill for the primary "Deploy Syrka" buttons: violet into Syrka blue, with a soft glow. */
export const DEPLOY_STYLE = {
  background: 'linear-gradient(135deg, #7a5cff 0%, #2b2bff 55%, #1f5fff 100%)',
  boxShadow: '0 14px 34px -14px rgba(122, 92, 255, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.28)',
}
/** Fill for secondary landing buttons: frosted glass with a faint violet sheen. */
export const GHOST_STYLE = {
  background: 'linear-gradient(135deg, rgba(185, 166, 255, 0.16), rgba(255, 255, 255, 0.03))',
  boxShadow: 'inset 0 0 0 1px rgba(201, 188, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
}
/** Tight bounds of the drawn symbol, including half the stroke. */
export const SYMBOL_BOX = { x: 9, y: 30, w: 82, h: 38 }

export function SyrkaSymbol({ className, strokeWidth = SYMBOL_STROKE, title }: { className?: string; strokeWidth?: number; title?: string }) {
  const { x, y, w, h } = SYMBOL_BOX
  return (
    <svg viewBox={`${x} ${y} ${w} ${h}`} className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      {SYMBOL_LINES.map((pts, i) => <polyline key={i} points={pts.map(p => p.join(',')).join(' ')} />)}
    </svg>
  )
}

/** Full logo (symbol + SYRKA wordmark), white on transparent. Intrinsic size 1945×228. */
export function SyrkaLogo({ className, preload = false }: { className?: string; preload?: boolean }) {
  return <Image src="/brand/syrka-logo-white.png" alt="Syrka" width={1945} height={228} priority={preload} className={className} />
}
