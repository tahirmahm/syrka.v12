'use client'

import { useEffect, useCallback } from 'react'
import { X, ArrowUp, Zap, BookOpen, Target } from 'lucide-react'
import type { CurriculumAnalysisResult } from '@/lib/types'

interface CurriculumRecommendationsProps {
  analysis: CurriculumAnalysisResult
  programmeName: string
  onClose: () => void
  accentColor: string
}

function scoreColor(score: number): string {
  if (score < 60) return '#DC2626'
  if (score <= 80) return '#D97706'
  return '#16A34A'
}

const priorityStyles: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: '#FEF2F2', text: '#B91C1C', label: 'High Priority' },
  medium: { bg: '#FFFBEB', text: '#92400E', label: 'Medium Priority' },
  low: { bg: '#F0FDF4', text: '#15803D', label: 'Low Priority' },
}

export default function CurriculumRecommendations({
  analysis,
  programmeName,
  onClose,
  accentColor,
}: CurriculumRecommendationsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const priority = priorityStyles[analysis.implementation_priority] || priorityStyles.medium
  const scoreDelta = analysis.projected_score_after_changes - analysis.current_score

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-2xl bg-[#0D1117] shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0D1117] border-b border-[#21262D]">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58] mb-0.5">
                Curriculum Analysis
              </p>
              <h2 className="font-display text-lg text-[#E6EDF3]">{programmeName}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="inline-block px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: priority.bg, color: priority.text }}
              >
                {priority.label}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[#161B22] transition-colors text-[#484F58] hover:text-[#C9D1D9]"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* Overall Assessment */}
          <section>
            <h3 className="font-display text-sm text-[#E6EDF3] mb-2">Overall Assessment</h3>
            <p className="text-sm text-[#C9D1D9] leading-relaxed">{analysis.overall_assessment}</p>
          </section>

          {/* Score Comparison */}
          <section>
            <h3 className="font-display text-sm text-[#E6EDF3] mb-3">Score Projection</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0D1117] rounded-lg border border-[#21262D] p-4 text-center">
                <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58] mb-1">
                  Current Score
                </p>
                <p
                  className="text-3xl font-semibold tabular-nums"
                  style={{ color: scoreColor(analysis.current_score) }}
                >
                  {analysis.current_score}%
                </p>
              </div>
              <div className="bg-[#0D1117] rounded-lg border border-[#21262D] p-4 text-center">
                <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58] mb-1">
                  Projected Score
                </p>
                <p
                  className="text-3xl font-semibold tabular-nums"
                  style={{ color: scoreColor(analysis.projected_score_after_changes) }}
                >
                  {analysis.projected_score_after_changes}%
                </p>
                {scoreDelta > 0 && (
                  <span className="inline-flex items-center gap-0.5 mt-1 text-xs font-medium text-green-600">
                    <ArrowUp size={12} />
                    +{scoreDelta} pts
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Employer Readiness Impact */}
          {analysis.employer_readiness_impact && (
            <section className="px-4 py-3 rounded-lg border border-[#21262D] bg-[#0D1117]">
              <div className="flex items-start gap-2.5">
                <Target size={14} className="text-[#484F58] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58] mb-0.5">
                    Employer Readiness Impact
                  </p>
                  <p className="text-sm text-[#C9D1D9] leading-relaxed">
                    {analysis.employer_readiness_impact}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Course-by-Course Table */}
          {analysis.course_scores.length > 0 && (
            <section>
              <h3 className="font-display text-sm text-[#E6EDF3] mb-3">Course Analysis</h3>
              <div className="border border-[#21262D] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#21262D] bg-[#0D1117]/80">
                      <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58]">
                        Course
                      </th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58] w-20">
                        Score
                      </th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58]">
                        Recommendation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.course_scores.map((cs) => (
                      <tr
                        key={cs.course_code}
                        className="border-b border-[#21262D] last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-[11px] text-[#484F58] mr-2">
                            {cs.course_code}
                          </span>
                          <span className="text-[#E6EDF3]">{cs.course_name}</span>
                          {cs.issue && (
                            <p className="text-[11px] text-red-500 mt-0.5">{cs.issue}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className="font-semibold tabular-nums"
                            style={{ color: scoreColor(cs.current_score) }}
                          >
                            {cs.current_score}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#C9D1D9] text-xs leading-relaxed">
                          {cs.recommendation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* New Modules Recommended */}
          {analysis.new_modules_recommended.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} style={{ color: accentColor }} />
                <h3 className="font-display text-sm text-[#E6EDF3]">
                  Recommended New Modules
                </h3>
              </div>
              <div className="grid gap-3">
                {analysis.new_modules_recommended.map((mod) => (
                  <div
                    key={mod.name}
                    className="rounded-lg border border-[#21262D] p-4 bg-[#0D1117]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-display text-sm text-[#E6EDF3]">{mod.name}</h4>
                      {mod.replaces && (
                        <span className="shrink-0 text-[11px] text-[#484F58]">
                          Replaces: {mod.replaces}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#C9D1D9] leading-relaxed mt-1.5">{mod.rationale}</p>
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      {mod.target_skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: `${accentColor}10`,
                            color: accentColor,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    {mod.estimated_demand_uplift && (
                      <p className="text-[11px] text-[#484F58] mt-2">
                        Estimated demand uplift: {mod.estimated_demand_uplift}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quick Wins */}
          {analysis.quick_wins.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} style={{ color: accentColor }} />
                <h3 className="font-display text-sm text-[#E6EDF3]">Quick Wins</h3>
              </div>
              <ul className="space-y-2">
                {analysis.quick_wins.map((win, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="text-sm text-[#C9D1D9] leading-relaxed">{win}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
