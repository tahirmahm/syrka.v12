'use client'

import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'

export interface DesmosExpression {
  id: string
  latex: string
  color?: string
}

export interface DesmosLearningGraphProps {
  title: string
  description: string
  expressions: DesmosExpression[]
  viewport: { left: number; right: number; bottom: number; top: number }
  structuredFallback: { label: string; value: string }[]
}

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (element: HTMLElement, options?: Record<string, unknown>) => DesmosCalculatorInstance
    }
  }
}

interface DesmosCalculatorInstance {
  setExpression: (expr: { id: string; latex: string; color?: string }) => void
  setMathBounds: (bounds: { left: number; right: number; bottom: number; top: number }) => void
  destroy: () => void
}

type LoadState = 'unavailable' | 'loading' | 'error' | 'ready'

let scriptLoadPromise: Promise<void> | null = null

function loadDesmosScript(apiKey: string): Promise<void> {
  if (window.Desmos) return Promise.resolve()
  if (scriptLoadPromise) return scriptLoadPromise
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://www.desmos.com/api/v1.9/calculator.js?apiKey=${encodeURIComponent(apiKey)}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Desmos script failed to load.'))
    document.head.appendChild(script)
  })
  return scriptLoadPromise
}

/**
 * LEARN-002 §11 — Desmos adapter. The API key is read only from
 * NEXT_PUBLIC_DESMOS_API_KEY (never hard-coded); when unset, this
 * component never attempts to load Desmos at all and renders an honest
 * "unavailable" state plus the structured table fallback. The calculator
 * script itself is loaded lazily, only once this component actually
 * mounts (i.e. only when a student opens a Desmos-backed visual) — never
 * eagerly on an ordinary concept route.
 */
export function DesmosLearningGraph({ title, description, expressions, viewport, structuredFallback }: DesmosLearningGraphProps) {
  const apiKey = process.env.NEXT_PUBLIC_DESMOS_API_KEY
  const containerRef = useRef<HTMLDivElement>(null)
  const calculatorRef = useRef<DesmosCalculatorInstance | null>(null)
  const [state, setState] = useState<LoadState>(apiKey ? 'loading' : 'unavailable')
  const [showTable, setShowTable] = useState(!apiKey)

  useEffect(() => {
    if (!apiKey || !containerRef.current) return
    let cancelled = false

    loadDesmosScript(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current || !window.Desmos) return
        const calculator = window.Desmos.GraphingCalculator(containerRef.current, {
          keypad: false,
          settingsMenu: false,
          expressionsCollapsed: true,
          border: false,
        })
        calculator.setMathBounds(viewport)
        for (const expr of expressions) calculator.setExpression(expr)
        calculatorRef.current = calculator
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })

    return () => {
      cancelled = true
      calculatorRef.current?.destroy()
      calculatorRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  return (
    <div className="flex flex-col gap-3 rounded-campus-md border border-campus-border bg-campus-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{title}</p>
        {state === 'unavailable' && <Badge tone="neutral">Desmos not configured</Badge>}
        {state === 'error' && <Badge tone="amber">Desmos unavailable</Badge>}
      </div>
      <p className="font-campus-sans text-campus-sm text-campus-text">{description}</p>

      {state === 'unavailable' || state === 'error' ? (
        <p className="font-campus-sans text-campus-xs text-campus-muted">
          The interactive graph {state === 'unavailable' ? 'is not configured in this environment' : 'could not be loaded right now'} — see the table below instead.
        </p>
      ) : (
        <>
          {state === 'loading' && <Skeleton className="h-72 w-full" />}
          <div ref={containerRef} className={`h-72 w-full ${state === 'ready' ? '' : 'hidden'}`} role="img" aria-label={description} />
        </>
      )}

      <div className="border-t border-campus-border pt-3">
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-expanded={showTable}
          className="font-campus-sans text-campus-xs font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark"
        >
          {showTable ? 'Hide' : 'Show'} table
        </button>
        {showTable && (
          <table className="mt-2 w-full text-left font-campus-mono text-campus-xs text-campus-text">
            <tbody>
              {structuredFallback.map((row) => (
                <tr key={row.label} className="border-t border-campus-border">
                  <th scope="row" className="py-1 pr-3 font-normal text-campus-muted">{row.label}</th>
                  <td className="py-1 tabular-nums">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
