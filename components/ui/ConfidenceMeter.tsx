import type { ConfidenceScore } from '@/lib/campus-types'
import { Badge, type BadgeTone } from './Badge'

const bandFillClasses: Record<ConfidenceScore['band'], string> = {
  Unsupported: 'bg-campus-stone-500',
  Emerging: 'bg-campus-amber-600 dark:bg-campus-amber-dark',
  Supported: 'bg-campus-blue-600 dark:bg-campus-blue-dark',
  Strong: 'bg-campus-green-600 dark:bg-campus-green-dark',
  Verified: 'bg-campus-gold-500 dark:bg-campus-gold-dark',
}

const bandBadgeTone: Record<ConfidenceScore['band'], BadgeTone> = {
  Unsupported: 'neutral',
  Emerging: 'amber',
  Supported: 'blue',
  Strong: 'green',
  Verified: 'gold',
}

export interface ConfidenceMeterProps {
  confidence: ConfidenceScore
  /** Optional short reason shown for explainability (REASON-001 explanation schema). */
  explanation?: string
}

/**
 * Confidence indicator — numeric + band + explanation, never color-only
 * (DESIGN-001 §10, §13). Bands are constitutional (REASON-001 §5.7).
 */
export function ConfidenceMeter({ confidence, explanation }: ConfidenceMeterProps) {
  const percent = Math.round(confidence.score * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Badge tone={bandBadgeTone[confidence.band]}>{confidence.band}</Badge>
        <span className="font-campus-mono text-campus-xs tabular-nums text-campus-muted">{percent}%</span>
      </div>
      <div
        role="meter"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${confidence.band}, ${percent} percent confidence`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-campus-stone-300 dark:bg-campus-border"
      >
        <div
          className={`h-full rounded-full transition-all duration-campus-slow ease-campus-standard ${bandFillClasses[confidence.band]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {explanation && <p className="font-campus-sans text-campus-xs text-campus-muted">{explanation}</p>}
    </div>
  )
}
