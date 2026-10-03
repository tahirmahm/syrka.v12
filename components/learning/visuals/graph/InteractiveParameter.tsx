'use client'

import { useId } from 'react'

export interface InteractiveParameterProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
  formatValue?: (value: number) => string
}

/**
 * Every graph parameter gets both a drag-friendly slider and a real
 * keyboard/numeric control bound to the same value — a learner must be
 * able to complete the lesson without dragging anything (see the founder's
 * accessibility requirement §13). Used for every learner-controlled
 * LearningGraphSpec parameter; the graph itself may additionally offer a
 * draggable Mafs point for the one value that most benefits from direct
 * manipulation.
 */
export function InteractiveParameter({ label, value, min, max, step, unit, onChange, formatValue }: InteractiveParameterProps) {
  const sliderId = useId()
  const numberId = useId()
  const display = formatValue ? formatValue(value) : `${value}${unit ?? ''}`

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={sliderId} className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
          {label}
        </label>
        <span className="font-campus-mono text-campus-xs tabular-nums text-campus-text">{display}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 w-full flex-1 cursor-pointer appearance-none rounded-full bg-campus-border accent-campus-blue-600 dark:accent-campus-blue-dark"
        />
        <label htmlFor={numberId} className="sr-only">
          {label} — exact value
        </label>
        <input
          id={numberId}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const next = Number(e.target.value)
            if (!Number.isNaN(next)) onChange(Math.min(max, Math.max(min, next)))
          }}
          className="w-20 rounded-campus-sm border border-campus-border bg-campus-surface px-2 py-1 font-campus-mono text-campus-xs tabular-nums text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        />
      </div>
    </div>
  )
}
