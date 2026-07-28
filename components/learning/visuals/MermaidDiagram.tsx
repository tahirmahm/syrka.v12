'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export interface MermaidDiagramProps {
  definition: string
  title: string
  altText: string
  structuredTextEquivalent: string
}

/** Per-session cache keyed by definition text — the same VisualSpec never re-renders twice. */
const renderCache = new Map<string, string>()

/**
 * LEARN-002 §10 — the Mermaid renderer. Lazy-loaded (dynamic import,
 * never in the base concept bundle), calls mermaid.parse() before
 * rendering, uses securityLevel "strict" (no click directives, no
 * scripts, no arbitrary links reach the DOM), then runs the resulting
 * SVG through DOMPurify's SVG profile as a second, independent layer of
 * sanitisation before injecting it. Always renders an accessible title,
 * alt text, and a structured-text equivalent alongside the diagram —
 * never the diagram alone.
 */
export function MermaidDiagram({ definition, title, altText, structuredTextEquivalent }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showText, setShowText] = useState(false)
  const renderId = useId().replace(/:/g, '')
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    const cached = renderCache.get(definition)
    if (cached) {
      setSvg(cached)
      return
    }

    async function render() {
      try {
        const [{ default: mermaid }, { default: DOMPurify }] = await Promise.all([import('mermaid'), import('dompurify')])
        // htmlLabels: false forces plain SVG <text> labels instead of
        // foreignObject+HTML — DOMPurify's SVG profile strips foreignObject,
        // which would otherwise silently delete every node/edge label. This
        // is also the stricter, safer choice on its own: it removes HTML
        // entirely from the rendered output rather than relying on a
        // sanitiser allow-list to get an HTML-in-SVG exception right.
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', fontFamily: 'inherit', htmlLabels: false, flowchart: { htmlLabels: false } })

        const parseOk = await mermaid.parse(definition, { suppressErrors: true })
        if (!parseOk) throw new Error('Diagram definition failed validation.')

        const { svg: rawSvg } = await mermaid.render(`mermaid-${renderId}`, definition)
        const cleanSvg = DOMPurify.sanitize(rawSvg, { USE_PROFILES: { svg: true, svgFilters: true } })
        if (cancelledRef.current) return
        renderCache.set(definition, cleanSvg)
        setSvg(cleanSvg)
      } catch {
        if (!cancelledRef.current) setError('This diagram could not be rendered — see the text description below.')
      }
    }
    render()

    return () => {
      cancelledRef.current = true
    }
  }, [definition, renderId])

  return (
    <figure className="flex flex-col gap-3 rounded-campus-md border border-campus-border bg-campus-surface p-4">
      <figcaption className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{title}</figcaption>

      {error ? (
        <p role="status" className="font-campus-sans text-campus-sm text-campus-amber-600 dark:text-campus-amber-dark">{error}</p>
      ) : svg ? (
        <div role="img" aria-label={altText} className="[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <Skeleton className="h-48 w-full" />
      )}

      <div className="border-t border-campus-border pt-3">
        <button
          type="button"
          onClick={() => setShowText((v) => !v)}
          aria-expanded={showText}
          className="font-campus-sans text-campus-xs font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark"
        >
          {showText ? 'Hide' : 'Show'} structured text equivalent
        </button>
        {showText && <p className="mt-2 font-campus-sans text-campus-xs text-campus-muted">{structuredTextEquivalent}</p>}
      </div>
    </figure>
  )
}
