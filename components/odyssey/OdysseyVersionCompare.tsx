'use client'

import { useState } from 'react'
import { X } from '@phosphor-icons/react/dist/ssr'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import type { OdysseyPlanVersion } from '@/lib/campus-types'

export interface OdysseyVersionCompareProps {
  versions: OdysseyPlanVersion[]
  /** versionId -> milestoneId -> title, resolved server-side from each version's own snapshot. */
  milestoneTitlesByVersion: Record<string, Record<string, string>>
  onClose: () => void
}

function titleFor(milestoneTitlesByVersion: Record<string, Record<string, string>>, versionId: string, milestoneId: string): string {
  return milestoneTitlesByVersion[versionId]?.[milestoneId] ?? milestoneId
}

/**
 * Plan-version comparison. Uses only the versioned domain records already
 * produced by generation/replanning — no fabricated cryptographic proof or
 * permanent database persistence; this session's plan history lives only in
 * the server's in-memory store, disclosed honestly below.
 */
export function OdysseyVersionCompare({ versions, milestoneTitlesByVersion, onClose }: OdysseyVersionCompareProps) {
  const sorted = [...versions].sort((a, b) => a.version - b.version)
  const [fromId, setFromId] = useState(sorted[sorted.length - 2]?.id ?? sorted[0]?.id)
  const [toId, setToId] = useState(sorted[sorted.length - 1]?.id)

  const from = sorted.find((v) => v.id === fromId)
  const to = sorted.find((v) => v.id === toId)

  return (
    <Panel className="flex flex-col gap-4" role="dialog" aria-label="Compare Odyssey plan versions">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-campus-sans text-campus-base font-medium text-campus-text">Compare plan versions</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close comparison"
          className="rounded-campus-sm p-1.5 text-campus-muted hover:bg-campus-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 font-campus-sans text-campus-sm text-campus-text">
          From version
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 text-campus-sm"
          >
            {sorted.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version} — {v.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-campus-sans text-campus-sm text-campus-text">
          To version
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 text-campus-sm"
          >
            {sorted.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version} — {v.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {to && (
        <div className="flex flex-col gap-3 border-t border-campus-border pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">v{to.version}</Badge>
            <span className="font-campus-sans text-campus-sm text-campus-text">{to.triggerSummary}</span>
          </div>
          <p className="font-campus-sans text-campus-xs text-campus-muted">{to.reasoningSummary}</p>

          <DiffList label="Added" ids={to.milestonesAddedIds} versionId={to.id} titles={milestoneTitlesByVersion} tone="green" />
          <DiffList label="Removed" ids={to.milestonesRemovedIds} versionId={from?.id ?? to.id} titles={milestoneTitlesByVersion} tone="red" />
          <DiffList label="Changed" ids={to.milestonesChangedIds} versionId={to.id} titles={milestoneTitlesByVersion} tone="amber" />
          <DiffList label="Reordered" ids={to.milestonesReorderedIds} versionId={to.id} titles={milestoneTitlesByVersion} tone="neutral" />
          <DiffList label="Superseded" ids={to.milestonesSupersededIds} versionId={to.id} titles={milestoneTitlesByVersion} tone="neutral" />

          <p className="font-campus-sans text-[11px] text-campus-muted">
            Plan versions are kept for this session only — a real deployment would persist them durably; here they reset if the server restarts.
          </p>
        </div>
      )}
    </Panel>
  )
}

function DiffList({
  label,
  ids,
  versionId,
  titles,
  tone,
}: {
  label: string
  ids: string[]
  versionId: string
  titles: Record<string, Record<string, string>>
  tone: 'green' | 'red' | 'amber' | 'neutral'
}) {
  if (ids.length === 0) return null
  return (
    <div>
      <p className="mb-1 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">
        {label} ({ids.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => (
          <Badge key={id} tone={tone}>
            {titleFor(titles, versionId, id)}
          </Badge>
        ))}
      </div>
    </div>
  )
}
