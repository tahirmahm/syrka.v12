'use client'

import { useState, useEffect } from 'react'
import type { Programme } from '@/lib/types'
import type { CurriculumAnalysisResult } from '@/lib/types'
import CurriculumRecommendations from './CurriculumRecommendations'

interface ProgrammeAlignmentTableProps {
  programmes: Programme[]
  accentColor: string
}

function freshnessColor(score: number): string {
  if (score >= 80) return '#16A34A'
  if (score >= 50) return '#D97706'
  return '#DC2626'
}

function freshnessLabel(score: number): string {
  if (score >= 80) return 'Current'
  if (score >= 50) return 'Aging'
  return 'Stale'
}

const levelColors: Record<string, { bg: string; text: string }> = {
  certificate: { bg: '#F3F4F6', text: '#4B5563' },
  diploma: { bg: '#EFF6FF', text: '#1D4ED8' },
  bachelor: { bg: '#F0FDF4', text: '#15803D' },
  master: { bg: '#FDF4FF', text: '#7E22CE' },
  phd: { bg: '#FEF2F2', text: '#B91C1C' },
}

function alignmentColor(score: number | null): string {
  if (score == null) return '#9CA3AF'
  if (score < 60) return '#DC2626'
  if (score <= 80) return '#D97706'
  return '#16A34A'
}

export default function ProgrammeAlignmentTable({
  programmes,
  accentColor,
}: ProgrammeAlignmentTableProps) {
  const [analysing, setAnalysing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<CurriculumAnalysisResult | null>(null)
  const [analysisProgrammeName, setAnalysisProgrammeName] = useState('')
  const [freshnessScores, setFreshnessScores] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/research/freshness')
      .then(r => r.json())
      .then(data => setFreshnessScores(data.scores ?? {}))
      .catch(() => {})
  }, [])

  async function handleAnalyse(programme: Programme) {
    setLoading(true)
    setAnalysing(programme.id)
    setAnalysisProgrammeName(programme.name)

    try {
      const res = await fetch('/api/ai/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programmeId: programme.id }),
      })
      const data = await res.json()
      setAnalysis(data)
    } catch {
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setAnalysing(null)
    setAnalysis(null)
    setAnalysisProgrammeName('')
  }

  return (
    <>
      <div className="bg-[#0D1117] rounded-lg border border-[#21262D] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#21262D]">
              <th className="text-left px-4 py-3 text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58]">
                Programme
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58]">
                Level
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58]">
                Annual Graduates
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58] min-w-[180px]">
                Alignment Score
              </th>
              <th className="text-center px-4 py-3 text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58]">
                ESCO Skills
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58]">
                Employment Rate
              </th>
              <th className="text-center px-4 py-3 text-[11px] font-medium tracking-[0.08em] uppercase text-[#484F58]">
                Freshness
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {programmes.map((prog) => {
              const score = prog.overall_alignment_score
              const barColor = alignmentColor(score)
              const levelStyle = prog.level ? levelColors[prog.level] : null

              return (
                <tr
                  key={prog.id}
                  className="border-b border-[#21262D] last:border-b-0 hover:bg-[#0D1117]/50 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-[#E6EDF3]">{prog.name}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {prog.level && levelStyle ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize"
                        style={{ backgroundColor: levelStyle.bg, color: levelStyle.text }}
                      >
                        {prog.level}
                      </span>
                    ) : (
                      <span className="text-[#484F58]">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-[#C9D1D9]">
                    {prog.annual_graduates != null
                      ? prog.annual_graduates.toLocaleString()
                      : '--'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 bg-[#161B22] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: score != null ? `${score}%` : '0%',
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-semibold tabular-nums w-10 text-right"
                        style={{ color: barColor }}
                      >
                        {score != null ? `${score}%` : '--'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {score != null ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: `${accentColor}12`,
                          color: accentColor,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1L10 5.5L15 6.2L11.5 9.5L12.4 14.5L8 12L3.6 14.5L4.5 9.5L1 6.2L6 5.5L8 1Z" fill="currentColor" opacity="0.6"/></svg>
                        {Math.round(score / 10)}
                      </span>
                    ) : (
                      <span className="text-[#484F58]">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-[#C9D1D9]">
                    {prog.employment_rate_6months != null
                      ? `${prog.employment_rate_6months}%`
                      : '--'}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {freshnessScores[prog.id] != null ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums"
                        style={{
                          backgroundColor: `${freshnessColor(freshnessScores[prog.id])}18`,
                          color: freshnessColor(freshnessScores[prog.id]),
                        }}
                      >
                        {freshnessScores[prog.id]}% {freshnessLabel(freshnessScores[prog.id])}
                      </span>
                    ) : (
                      <span className="text-[#484F58]">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleAnalyse(prog)}
                      disabled={loading && analysing === prog.id}
                      className="
                        px-3 py-1.5 rounded text-[12px] font-medium
                        border transition-colors duration-150
                        hover:shadow-sm disabled:opacity-50 disabled:cursor-wait
                      "
                      style={{
                        borderColor: accentColor,
                        color: accentColor,
                      }}
                    >
                      {loading && analysing === prog.id ? 'Analysing...' : 'Analyse'}
                    </button>
                  </td>
                </tr>
              )
            })}
            {programmes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[#484F58] text-sm">
                  No programmes found for this institution.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Curriculum Analysis Modal */}
      {analysing && analysis && (
        <CurriculumRecommendations
          analysis={analysis}
          programmeName={analysisProgrammeName}
          onClose={handleClose}
          accentColor={accentColor}
        />
      )}
    </>
  )
}
