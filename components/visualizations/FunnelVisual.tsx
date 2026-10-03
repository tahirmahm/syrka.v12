'use client'

import { motion } from 'framer-motion'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'

export interface FunnelStage {
  id: string
  label: string
  /** Real count for this stage — never invented; pass 0 rather than fabricate. */
  count: number
  detail?: string
}

export interface FunnelVisualProps {
  stages: FunnelStage[]
  dataCaption: string
  className?: string
}

/**
 * A minimal decreasing-stage funnel — width encodes what fraction of the
 * top-of-funnel count reached each stage, with a percentage readout and a
 * staggered enter (matching Bklit UI's `funnel-chart.tsx` staggerDelay
 * idea; own bar-based layout rather than its layered-ring rendering,
 * since this chart only ever has 3-5 stages and a full ring renderer
 * would add complexity this use never needs). Real counts only — no
 * invented numbers. Every bar has a native `<title>` tooltip.
 */
export function FunnelVisual({ stages, dataCaption, className = '' }: FunnelVisualProps) {
  const reduceMotion = useReducedMotionSafe()
  const top = Math.max(stages[0]?.count ?? 1, 1)

  return (
    <div className={className}>
      <ol className="flex flex-col gap-1.5">
        {stages.map((stage, i) => {
          const pct = Math.max(Math.min(stage.count / top, 1), 0)
          const pctLabel = `${Math.round(pct * 100)}%`
          return (
            <li key={stage.id} className="flex items-center gap-3">
              <div className="w-36 shrink-0 font-campus-sans text-campus-xs text-campus-muted">{stage.label}</div>
              <div className="h-6 flex-1 rounded-campus-sm bg-campus-surface-raised">
                <motion.div
                  title={`${stage.label}: ${stage.count} (${pctLabel} of ${stages[0]?.label ?? 'total'})`}
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{ width: `${Math.max(pct * 100, 6)}%` }}
                  transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
                  className="flex h-6 items-center justify-end gap-2 rounded-campus-sm bg-campus-ink-950 px-2 dark:bg-campus-white"
                >
                  <span className="font-campus-mono text-[11px] font-medium tabular-nums text-campus-white dark:text-campus-ink-950">
                    {stage.count}
                  </span>
                  <span className="font-campus-mono text-[9px] tabular-nums text-campus-white/70 dark:text-campus-ink-950/60">{pctLabel}</span>
                </motion.div>
              </div>
            </li>
          )
        })}
      </ol>
      <dl className="mt-3 flex flex-col gap-1">
        {stages.filter((s) => s.detail).map((stage) => (
          <div key={stage.id} className="flex gap-2 font-campus-sans text-campus-xs">
            <dt className="w-36 shrink-0 text-campus-muted">{stage.label}</dt>
            <dd className="text-campus-text">{stage.detail}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{dataCaption}</p>
    </div>
  )
}
