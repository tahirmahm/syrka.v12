'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import { overlayTransition, campusMotion } from '@/lib/motion/campus-motion'

export interface CommandItem {
  id: string
  label: string
  subtitle?: string
  href: string
  group: string
}

export interface FloatingCommandSurfaceProps {
  items: CommandItem[]
}

/**
 * Global compact command surface — supplements the visible rail navigation,
 * never replaces it. Opens via Cmd/Ctrl+K or its trigger button, filters the
 * supplied item set (modules, students, courses, Evidence, capabilities —
 * whatever the caller's role can actually reach), and navigates on select.
 * No new dependency: filtering, keyboard nav, and focus handling are
 * implemented directly since the app's existing primitives cover it.
 */
export function FloatingCommandSurface({ items }: FloatingCommandSurfaceProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const router = useRouter()
  const reduceMotion = useReducedMotionSafe()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.slice(0, 8)
    return items
      .filter((item) => item.label.toLowerCase().includes(q) || item.subtitle?.toLowerCase().includes(q) || item.group.toLowerCase().includes(q))
      .slice(0, 8)
  }, [items, query])

  useEffect(() => {
    function onGlobalKey(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        triggerRef.current = document.activeElement as HTMLElement
        setOpen((v) => !v)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onGlobalKey)
    return () => document.removeEventListener('keydown', onGlobalKey)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      inputRef.current?.focus()
    } else {
      triggerRef.current?.focus?.()
    }
  }, [open])

  function navigate(item: CommandItem) {
    setOpen(false)
    router.push(item.href)
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filtered[activeIndex]
      if (item) navigate(item)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          triggerRef.current = document.activeElement as HTMLElement
          setOpen(true)
        }}
        className="flex items-center gap-2 rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-1.5 font-campus-sans text-campus-sm text-campus-muted transition-colors duration-campus-fast hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        aria-label="Open command search"
      >
        <MagnifyingGlass size={14} aria-hidden="true" />
        <span className="hidden sm:inline">Search Campus</span>
        <kbd className="hidden rounded border border-campus-border px-1 font-campus-mono text-[10px] text-campus-muted sm:inline">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: campusMotion.opacity.scrim }}
              exit={{ opacity: 0 }}
              transition={overlayTransition(Boolean(reduceMotion))}
              className="fixed inset-0 z-40 bg-campus-ink-950"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-0 top-24 z-50 mx-auto flex w-full max-w-lg justify-center px-4">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Command search"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={reduceMotion ? { duration: 0 } : campusMotion.spring.snappy}
                className="w-full rounded-campus-lg border border-campus-border bg-campus-surface shadow-campus-panel"
              >
                <div className="flex items-center gap-2 border-b border-campus-border px-4 py-3">
                  <MagnifyingGlass size={16} className="text-campus-muted" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setActiveIndex(0)
                    }}
                    onKeyDown={onInputKeyDown}
                    placeholder="Jump to a module, student, course, evidence, or capability…"
                    aria-label="Search Campus"
                    aria-activedescendant={filtered[activeIndex] ? `command-item-${filtered[activeIndex].id}` : undefined}
                    role="combobox"
                    aria-expanded
                    aria-controls="command-list"
                    className="flex-1 bg-transparent font-campus-sans text-campus-sm text-campus-text outline-none placeholder:text-campus-muted"
                  />
                </div>
                <ul id="command-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
                  {filtered.length === 0 && <li className="px-3 py-6 text-center font-campus-sans text-campus-sm text-campus-muted">No matches.</li>}
                  {filtered.map((item, i) => (
                    <li key={item.id} id={`command-item-${item.id}`} role="option" aria-selected={i === activeIndex}>
                      <button
                        type="button"
                        onClick={() => navigate(item)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`flex w-full flex-col items-start rounded-campus-sm px-3 py-2 text-left ${i === activeIndex ? 'bg-campus-surface-raised' : ''}`}
                      >
                        <span className="font-campus-sans text-campus-sm text-campus-text">{item.label}</span>
                        <span className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
                          {item.group}
                          {item.subtitle ? ` · ${item.subtitle}` : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
