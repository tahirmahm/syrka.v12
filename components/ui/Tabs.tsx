'use client'

import { useId, type ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

export interface TabsProps {
  items: TabItem[]
  activeId: string
  onChange: (id: string) => void
  ariaLabel: string
}

/** Accessible tabs primitive shared across Campus — arrow-key navigation, correct ARIA wiring, one implementation instead of a per-page reinvention. */
export function Tabs({ items, activeId, onChange, ariaLabel }: TabsProps) {
  const baseId = useId()

  function moveFocus(delta: 1 | -1) {
    const idx = items.findIndex((i) => i.id === activeId)
    const next = items[(idx + delta + items.length) % items.length]
    onChange(next.id)
    requestAnimationFrame(() => document.getElementById(`${baseId}-tab-${next.id}`)?.focus())
  }

  return (
    <div>
      <div role="tablist" aria-label={ariaLabel} className="flex gap-1 border-b border-campus-border">
        {items.map((item) => {
          const selected = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-controls={`${baseId}-panel-${item.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  e.preventDefault()
                  moveFocus(1)
                }
                if (e.key === 'ArrowLeft') {
                  e.preventDefault()
                  moveFocus(-1)
                }
              }}
              className={`-mb-px border-b-2 px-3 py-2 font-campus-sans text-campus-sm transition-colors duration-campus-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 ${
                selected ? 'border-campus-blue-600 font-medium text-campus-text dark:border-campus-blue-dark' : 'border-transparent text-campus-muted hover:text-campus-text'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {items.map((item) => (
        <div key={item.id} role="tabpanel" id={`${baseId}-panel-${item.id}`} aria-labelledby={`${baseId}-tab-${item.id}`} hidden={item.id !== activeId} tabIndex={0}>
          {item.id === activeId && item.content}
        </div>
      ))}
    </div>
  )
}
