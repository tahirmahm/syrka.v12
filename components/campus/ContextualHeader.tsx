'use client'

import { useState, type ReactNode } from 'react'
import { DotsThreeVertical } from '@phosphor-icons/react/dist/ssr'

export interface ContextualHeaderProps {
  title: string
  /** A concise contextual statement — what this page is showing right now, not a generic description. */
  statement?: string
  /** Only render breadcrumbs when they're structurally useful (nested detail views) — not on every route by default. */
  breadcrumbs?: ReactNode
  /** The one action this route cares about most. */
  primaryAction?: ReactNode
  /** Supporting actions — collapse into a menu on narrow viewports. */
  secondaryActions?: ReactNode[]
  /** A short label for the active view/mode, e.g. "Roadmap", "List". */
  viewMode?: string
  /** What's currently selected/scoped, e.g. "Version 1", "Cohort 2026". */
  scope?: string
}

/**
 * Route-aware contextual header — the richer alternative to the generic
 * PageHeader+Breadcrumbs pairing used identically across Campus today.
 * Adopted by Odyssey as the first integration; existing routes keep their
 * current PageHeader until their own redesign (Stage 5), per the Stage 1
 * scope boundary.
 */
export function ContextualHeader({ title, statement, breadcrumbs, primaryAction, secondaryActions = [], viewMode, scope }: ContextualHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="flex flex-col gap-3 border-b border-campus-border pb-6">
      {breadcrumbs}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-campus-sans text-campus-2xl font-semibold tracking-tight text-campus-text">{title}</h1>
            {viewMode && (
              <span className="rounded-full border border-campus-border px-2 py-0.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
                {viewMode}
              </span>
            )}
          </div>
          {statement && <p className="mt-1 max-w-2xl font-campus-sans text-campus-sm text-campus-muted">{statement}</p>}
          {scope && <p className="mt-1 font-campus-mono text-[10px] uppercase tracking-wide text-campus-faint">{scope}</p>}
        </div>

        {(primaryAction || secondaryActions.length > 0) && (
          <div className="flex items-center gap-2">
            {/* Desktop: every action visible. Mobile: secondary actions collapse into one menu. */}
            <div className="hidden items-center gap-2 sm:flex">
              {secondaryActions.map((action, i) => (
                <span key={i}>{action}</span>
              ))}
            </div>
            {primaryAction}
            {secondaryActions.length > 0 && (
              <div className="relative sm:hidden">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="More actions"
                  aria-expanded={menuOpen}
                  className="rounded-campus-sm p-2 text-campus-muted hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
                >
                  <DotsThreeVertical size={18} aria-hidden="true" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1 flex flex-col gap-1 rounded-campus-md border border-campus-border bg-campus-surface p-2 shadow-campus-panel">
                    {secondaryActions.map((action, i) => (
                      <span key={i}>{action}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
