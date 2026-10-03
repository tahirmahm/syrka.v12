import type { HTMLAttributes } from 'react'

export interface ApplicationCanvasProps extends HTMLAttributes<HTMLDivElement> {
  /** Reading column (document/list/overview) vs full-bleed spatial working surface (roadmap/graph). */
  bleed?: boolean
}

/**
 * The page's own working surface — distinct from Panel/Card, which are
 * content containers *within* a page. Reading-mode pages (overview, list,
 * document) get a centred column; spatial-mode pages (roadmap, graph) get
 * the full available width. The mode is a page-level decision, not a
 * per-component style — see the Campus Experience Constitution's spatial
 * page modes.
 */
export function ApplicationCanvas({ bleed = false, className = '', children, ...props }: ApplicationCanvasProps) {
  return (
    <div className={`${bleed ? 'w-full' : 'mx-auto w-full max-w-3xl'} ${className}`} {...props}>
      {children}
    </div>
  )
}
