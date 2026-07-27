import type { StudentLearningProjection } from '@/lib/utilities/learning-projection'

export interface IndependenceProgressionProps {
  counts: StudentLearningProjection['independenceCounts']
  totalAttempts: number
}

const ROWS: { key: keyof StudentLearningProjection['independenceCounts']; label: string; accentClass: string }[] = [
  { key: 'independent', label: 'Independent completions', accentClass: 'bg-campus-blue-600 dark:bg-campus-blue-dark' },
  { key: 'partiallyGuided', label: 'Partially guided completions', accentClass: 'bg-campus-amber-600 dark:bg-campus-amber-dark' },
  { key: 'guided', label: 'Guided completions', accentClass: 'bg-campus-stone-300 dark:bg-campus-stone-500' },
  { key: 'transferPassed', label: 'Transfer checks passed', accentClass: 'bg-campus-green-600 dark:bg-campus-green-dark' },
]

/**
 * "What can I now do independently?" — separate, named counts with an
 * explicit numerator/denominator (never a single blended percentage).
 * Highest hint level used is reported as its own fact, not folded into
 * the bars.
 */
export function IndependenceProgression({ counts, totalAttempts }: IndependenceProgressionProps) {
  if (totalAttempts === 0) {
    return <p className="font-campus-sans text-campus-sm text-campus-muted">No attempts recorded yet.</p>
  }

  return (
    <div className="flex flex-col gap-2.5">
      {ROWS.map((row) => {
        const value = counts[row.key] as number
        const pct = totalAttempts > 0 ? Math.round((value / totalAttempts) * 100) : 0
        return (
          <div key={row.key}>
            <div className="mb-1 flex items-center justify-between font-campus-sans text-campus-xs text-campus-text">
              <span>{row.label}</span>
              <span className="font-campus-mono text-campus-muted">
                {value} / {totalAttempts}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-campus-surface-raised" role="img" aria-label={`${row.label}: ${value} of ${totalAttempts} attempts, ${pct} percent`}>
              <div className={`h-full rounded-full ${row.accentClass}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
      <p className="mt-1 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Highest hint level used so far: {counts.highestHintLevel} of 7</p>
    </div>
  )
}
