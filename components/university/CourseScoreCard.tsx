'use client'

import type { Course } from '@/lib/types'

interface CourseScoreCardProps {
  course: Course
  recommendation: string | null
}

function scoreColor(score: number | null): string {
  if (score == null) return '#9CA3AF'
  if (score < 60) return '#DC2626'
  if (score <= 80) return '#D97706'
  return '#16A34A'
}

function scoreLabel(score: number | null): string {
  if (score == null) return 'N/A'
  if (score < 60) return 'Low'
  if (score <= 80) return 'Moderate'
  return 'Strong'
}

export default function CourseScoreCard({ course, recommendation }: CourseScoreCardProps) {
  const color = scoreColor(course.alignment_score)

  return (
    <div className="bg-white rounded-lg border border-[#E2E5EB] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {course.code && (
            <span className="inline-block text-[11px] font-mono font-medium tracking-wide text-gray-400 uppercase mb-1">
              {course.code}
            </span>
          )}
          <h4 className="font-display text-sm text-gray-900 leading-snug">{course.name}</h4>
        </div>
        {course.last_updated != null && (
          <span className="shrink-0 text-[11px] text-gray-400">
            Updated {course.last_updated}
          </span>
        )}
      </div>

      {/* Alignment Score Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            Alignment
          </span>
          <span className="text-xs font-semibold" style={{ color }}>
            {course.alignment_score != null ? `${course.alignment_score}%` : 'N/A'}
            <span className="ml-1.5 font-normal text-gray-400">
              {scoreLabel(course.alignment_score)}
            </span>
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: course.alignment_score != null ? `${course.alignment_score}%` : '0%',
              backgroundColor: color,
            }}
          />
        </div>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800 leading-relaxed">
          {recommendation}
        </div>
      )}
    </div>
  )
}
