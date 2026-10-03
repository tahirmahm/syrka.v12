'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'

type ActionState = 'none' | 'reviewed' | 'resubmission_requested' | 'flagged_for_curriculum_review'

const STATE_LABEL: Record<Exclude<ActionState, 'none'>, string> = {
  reviewed: 'Marked reviewed',
  resubmission_requested: 'Resubmission requested',
  flagged_for_curriculum_review: 'Flagged for curriculum review',
}

/**
 * Real, working actions — clicking genuinely changes this item's state
 * (not persisted across a reload, consistent with the rest of this
 * demonstration environment, but never a dead button with no effect).
 */
export function InterventionActions() {
  const [state, setState] = useState<ActionState>('none')

  if (state !== 'none') {
    return (
      <div className="mt-3 flex items-center gap-2 border-t border-campus-border pt-3">
        <Badge tone="green">{STATE_LABEL[state]}</Badge>
        <button type="button" onClick={() => setState('none')} className="font-campus-mono text-[10px] text-campus-muted hover:text-campus-text hover:underline">
          Undo
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-campus-border pt-3">
      <button type="button" onClick={() => setState('reviewed')} className="rounded-campus-sm border border-campus-border px-2.5 py-1 font-campus-sans text-[11px] text-campus-text hover:bg-campus-surface-raised">
        Mark reviewed
      </button>
      <button type="button" onClick={() => setState('resubmission_requested')} className="rounded-campus-sm border border-campus-border px-2.5 py-1 font-campus-sans text-[11px] text-campus-text hover:bg-campus-surface-raised">
        Request resubmission
      </button>
      <button type="button" onClick={() => setState('flagged_for_curriculum_review')} className="rounded-campus-sm border border-campus-border px-2.5 py-1 font-campus-sans text-[11px] text-campus-text hover:bg-campus-surface-raised">
        Recommend curriculum review
      </button>
    </div>
  )
}
