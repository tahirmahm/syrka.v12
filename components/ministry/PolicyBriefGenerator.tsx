'use client'

import { useState, useCallback } from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InterventionOption {
  name: string
  impact: string
  timeframe: string
  cost: string
  feasibility: 'high' | 'medium' | 'low'
}

interface GapAnalysisResult {
  executive_summary: string
  severity: 'critical' | 'high' | 'moderate' | 'low'
  key_risks: string[]
  intervention_options: InterventionOption[]
  policy_note: string
}

interface PolicyBriefGeneratorProps {
  visionSlug: string
  sectorId: string
  sectorName: string
  accentColor: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function severityBadge(severity: GapAnalysisResult['severity']): {
  bg: string
  text: string
  label: string
} {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Critical' }
    case 'high':
      return { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'High' }
    case 'moderate':
      return { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Moderate' }
    case 'low':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'Low' }
  }
}

function feasibilityClasses(level: InterventionOption['feasibility']): string {
  switch (level) {
    case 'high':
      return 'bg-emerald-50 text-emerald-700'
    case 'medium':
      return 'bg-amber-50 text-amber-700'
    case 'low':
      return 'bg-red-50 text-red-700'
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PolicyBriefGenerator({
  visionSlug,
  sectorId,
  sectorName,
  accentColor,
}: PolicyBriefGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GapAnalysisResult | null>(null)

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/ai/gap-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision_slug: visionSlug,
          sector_id: sectorId,
          sector_name: sectorName,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }

      const data: GapAnalysisResult = await res.json()
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }, [visionSlug, sectorId, sectorName])

  return (
    <div className="rounded-xl bg-[#0D1117] p-6 shadow-sm border border-slate-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-display text-lg text-slate-900">
            Policy Brief -- Gap Analysis
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            AI-generated policy assessment for {sectorName} workforce development.
          </p>
        </div>

        {!loading && (
          <button
            onClick={runAnalysis}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity
                       hover:opacity-90 flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            {result ? 'Re-run Analysis' : 'Run Gap Analysis'}
          </button>
        )}
      </div>

      {/* ------ Loading State ------ */}
      {loading && (
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
            <span className="text-sm text-slate-500">Generating policy brief for {sectorName}...</span>
          </div>
          <div className="space-y-3">
            <div className="h-4 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 rounded bg-slate-100 animate-pulse w-5/6" />
            <div className="h-4 rounded bg-slate-100 animate-pulse w-4/6" />
            <div className="h-20 rounded bg-slate-50 animate-pulse mt-4" />
            <div className="h-32 rounded bg-slate-50 animate-pulse" />
          </div>
        </div>
      )}

      {/* ------ Error State ------ */}
      {error && !loading && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-5 py-4">
          <p className="text-sm font-medium text-red-700 mb-1">Analysis Failed</p>
          <p className="text-xs text-red-500 leading-relaxed">{error}</p>
          <button
            onClick={runAnalysis}
            className="mt-3 text-xs font-medium text-red-600 hover:text-red-700 underline underline-offset-2"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* ------ Result ------ */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Executive Summary + Severity */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Executive Summary
              </h4>
              <span
                className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                  severityBadge(result.severity).bg
                } ${severityBadge(result.severity).text}`}
              >
                {severityBadge(result.severity).label} Severity
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {result.executive_summary}
            </p>
          </div>

          {/* Key Risks */}
          <div>
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Key Risks
            </h4>
            {result.key_risks.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No key risks identified.</p>
            ) : (
              <ul className="space-y-2">
                {result.key_risks.map((risk, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: accentColor }}
                    />
                    {risk}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Intervention Options Table */}
          <div>
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Intervention Options
            </h4>
            {result.intervention_options.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                No intervention options generated.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                        Intervention
                      </th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                        Impact
                      </th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                        Timeframe
                      </th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                        Cost
                      </th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                        Feasibility
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.intervention_options.map((opt, i) => (
                      <tr
                        key={i}
                        className={`border-b border-slate-50 ${
                          i % 2 === 1 ? 'bg-slate-50/50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {opt.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{opt.impact}</td>
                        <td className="px-4 py-3 text-slate-600">{opt.timeframe}</td>
                        <td className="px-4 py-3 text-slate-600">{opt.cost}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${feasibilityClasses(
                              opt.feasibility
                            )}`}
                          >
                            {opt.feasibility}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Policy Note */}
          <div className="border-t border-slate-100 pt-5">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Policy Note
            </h4>
            <div
              className="rounded-lg px-5 py-4 border-l-[3px]"
              style={{
                backgroundColor: `${accentColor}06`,
                borderLeftColor: accentColor,
              }}
            >
              <p className="text-sm text-slate-700 leading-relaxed italic">
                {result.policy_note}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------ Empty State ------ */}
      {!result && !loading && !error && (
        <div className="py-12 text-center">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ backgroundColor: `${accentColor}10` }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: accentColor }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <p className="text-sm text-slate-500 mb-1">
            No analysis generated yet.
          </p>
          <p className="text-xs text-slate-400">
            Click &quot;Run Gap Analysis&quot; to generate a policy brief for the {sectorName} sector.
          </p>
        </div>
      )}
    </div>
  )
}
