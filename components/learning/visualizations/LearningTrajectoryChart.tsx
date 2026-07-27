import type { TrajectoryPoint } from '@/lib/utilities/learning-projection'

const INDEPENDENCE_ROW: Record<string, { label: string; y: number }> = {
  independent: { label: 'Independent', y: 0 },
  partially_guided: { label: 'Partially guided', y: 1 },
  substantially_guided: { label: 'Guided', y: 2 },
  fully_guided: { label: 'Guided', y: 2 },
}

export interface LearningTrajectoryChartProps {
  trajectory: TrajectoryPoint[]
}

/**
 * Answers "where did I need help, and where didn't I?" — each attempt is
 * its own point on its own independence row (never averaged into one
 * score), positioned left-to-right by submission order, with hint level
 * as a second, separately-labelled dimension per point. Deterministic
 * SVG: no chart library needed for this small a dataset.
 */
export function LearningTrajectoryChart({ trajectory }: LearningTrajectoryChartProps) {
  if (trajectory.length === 0) {
    return <p className="font-campus-sans text-campus-sm text-campus-muted">No attempts recorded yet — this chart will populate as you work through activities.</p>
  }

  const width = 480
  const rowHeight = 40
  const labelRowHeight = 20
  const height = rowHeight * 3 + labelRowHeight + 12
  const leftGutter = 108
  const plotWidth = width - leftGutter - 24
  const stepX = trajectory.length > 1 ? plotWidth / (trajectory.length - 1) : 0

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="trajectory-title" className="w-full max-w-[480px]" preserveAspectRatio="xMinYMin meet">
        <title id="trajectory-title">Learning trajectory: each attempt plotted by independence level and hint level used</title>
        {Object.values(INDEPENDENCE_ROW)
          .filter((row, i, arr) => arr.findIndex((r) => r.y === row.y) === i)
          .map((row) => (
            <g key={row.y}>
              <text x={0} y={row.y * rowHeight + 16} className="fill-campus-muted font-campus-mono text-[9px] uppercase tracking-wide">
                {row.label}
              </text>
              <line x1={leftGutter} y1={row.y * rowHeight + 12} x2={width - 4} y2={row.y * rowHeight + 12} className="stroke-campus-border" strokeWidth={1} strokeDasharray="2 3" />
            </g>
          ))}
        {trajectory.map((point, i) => {
          const row = INDEPENDENCE_ROW[point.independenceLevel] ?? { label: point.independenceLevel, y: 2 }
          const cx = leftGutter + stepX * i
          const cy = row.y * rowHeight + 12
          const radius = 5 + point.hintLevelUsed * 0.8
          return (
            <g key={point.attemptId}>
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                className={point.correct ? 'fill-campus-blue-600 dark:fill-campus-blue-dark' : 'fill-campus-red-600 dark:fill-campus-red-dark'}
                opacity={0.85}
              />
              <text x={cx} y={rowHeight * 3 + labelRowHeight} textAnchor="middle" className="fill-campus-text font-campus-mono text-[9px]">
                Hint {point.hintLevelUsed}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="mt-1 font-campus-sans text-campus-xs text-campus-muted">
        Circle size = hint level used (larger means more help). Blue = correct, red = incorrect. Each point is one real attempt, in submission order.
      </p>
      <p className="sr-only">
        {trajectory
          .map((p, i) => `Attempt ${i + 1}: ${p.independenceLevel.replace('_', ' ')}, hint level ${p.hintLevelUsed}, ${p.correct ? 'correct' : 'incorrect'}, question type ${p.questionKind}.`)
          .join(' ')}
      </p>
    </div>
  )
}
