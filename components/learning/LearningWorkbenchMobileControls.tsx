'use client'

import { useState } from 'react'
import { ListBullets, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { Drawer } from '@/components/campus/Drawer'
import { BottomSheet } from '@/components/campus/BottomSheet'

export interface LearningWorkbenchMobileControlsProps {
  navigator: React.ReactNode
  inspector: React.ReactNode
}

/**
 * Mobile-only entry points for the two panes the desktop workbench keeps
 * always visible either side of the teaching canvas. Below the lg
 * breakpoint those panes move off-canvas — chapter navigator into a left
 * Drawer, Learning Intelligence (including the Tutor) into a bottom sheet —
 * so the lesson itself stays the thing in view, rather than every pane
 * stacking in page flow.
 */
export function LearningWorkbenchMobileControls({ navigator, inspector }: LearningWorkbenchMobileControlsProps) {
  const [navOpen, setNavOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 lg:hidden">
      <button
        type="button"
        onClick={() => setNavOpen(true)}
        className="flex items-center gap-1.5 rounded-campus-sm border border-campus-border px-3 py-1.5 font-campus-sans text-campus-xs text-campus-text hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
      >
        <ListBullets size={14} aria-hidden="true" />
        Chapter contents
      </button>
      <button
        type="button"
        onClick={() => setInspectorOpen(true)}
        className="flex items-center gap-1.5 rounded-campus-sm border border-campus-border px-3 py-1.5 font-campus-sans text-campus-xs text-campus-text hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
      >
        <Sparkle size={14} aria-hidden="true" />
        Learning Intelligence
      </button>

      <Drawer open={navOpen} onClose={() => setNavOpen(false)} ariaLabel="Chapter navigator" side="left">
        <div className="px-3 pb-4">{navigator}</div>
      </Drawer>

      <BottomSheet open={inspectorOpen} onClose={() => setInspectorOpen(false)} ariaLabel="Learning Intelligence">
        <div className="flex flex-col gap-4 p-2">{inspector}</div>
      </BottomSheet>
    </div>
  )
}
