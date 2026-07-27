'use client'

import type { Student } from '@/lib/types'

interface VisionAlignmentScoreProps {
  students: Student[]
  accentColor: string
}

interface YearBreakdown {
  year: number
  avgAlignment: number
  avgReadiness: number
  count: number
}

function computeBreakdown(students: Student[]): YearBreakdown[] {
  const yearMap = new Map<number, { alignments: number[]; readiness: number[] }>()

  for (const s of students) {
    const year = s.year_of_study ?? 0
    const entry = yearMap.get(year) ?? { alignments: [], readiness: [] }
    if (s.vision_alignment_score !== null) entry.alignments.push(s.vision_alignment_score)
    if (s.employment_readiness_score !== null) entry.readiness.push(s.employment_readiness_score)
    yearMap.set(year, entry)
  }

  return Array.from(yearMap.entries())
    .filter(([year]) => year > 0)
    .sort(([a], [b]) => a - b)
    .map(([year, data]) => ({
      year,
      avgAlignment:
        data.alignments.length > 0
          ? data.alignments.reduce((a, b) => a + b, 0) / data.alignments.length
          : 0,
      avgReadiness:
        data.readiness.length > 0
          ? data.readiness.reduce((a, b) => a + b, 0) / data.readiness.length
          : 0,
      count: data.alignments.length,
    }))
}

function RadialScore({ score, size, accentColor }: { score: number; size: number; accentColor: string }) {
  const strokeWidth = size > 120 ? 10 : 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-slate-800 tabular-nums">
          {score.toFixed(0)}
        </span>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  )
}

export default function VisionAlignmentScore({ students, accentColor }: VisionAlignmentScoreProps) {
  const validScores = students
    .map((s) => s.vision_alignment_score)
    .filter((s): s is number => s !== null)

  const overallScore =
    validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : 0

  const breakdown = computeBreakdown(students)

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-slate-800 tracking-tight">
        Vision Alignment Score
      </h3>

      <div className="bg-[#0D1117] rounded-lg border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Main radial score */}
          <div className="flex flex-col items-center gap-2">
            <RadialScore score={overallScore} size={160} accentColor={accentColor} />
            <p className="text-xs text-slate-400 mt-1">
              Cohort average across {validScores.length.toLocaleString()} students
            </p>
          </div>

          {/* Year breakdown */}
          <div className="flex-1 w-full space-y-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Breakdown by Year of Study
            </p>
            <div className="space-y-3">
              {breakdown.map((yr) => (
                <div key={yr.year} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Year {yr.year}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 tabular-nums">
                        {yr.count} students
                      </span>
                      <span
                        className="font-medium tabular-nums"
                        style={{ color: accentColor }}
                      >
                        {yr.avgAlignment.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${yr.avgAlignment}%`,
                        backgroundColor: accentColor,
                        opacity: 0.6 + (yr.avgAlignment / 100) * 0.4,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Employment readiness: {yr.avgReadiness.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>

            {breakdown.length === 0 && (
              <p className="text-sm text-slate-400 py-4">No year-of-study data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
