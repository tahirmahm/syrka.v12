'use client'

import { useState, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { SimulationResult } from './SimulationBriefDrawer'

interface ScenarioComparisonModalProps {
  simulationA: SimulationResult
  simulationB: SimulationResult
  country: string
  sector: string
  accentColor: string
  open: boolean
  onClose: () => void
}

interface MetricRow {
  label: string
  a: string
  b: string
  aWins: boolean
}

export default function ScenarioComparisonModal({
  simulationA,
  simulationB,
  country,
  sector,
  accentColor,
  open,
  onClose,
}: ScenarioComparisonModalProps) {
  const [opinion, setOpinion] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const generateOpinion = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/comparison/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationA: {
            id: simulationA.id,
            prescription_id: simulationA.prescription_id,
            prescription: {
              title: simulationA.prescription_title,
              costEstimate: 'N/A',
            },
            expectedValue: simulationA.expectedValue,
            confidenceLevel: simulationA.confidenceLevel,
            optimisticBound: simulationA.optimisticBound,
            pessimisticBound: simulationA.pessimisticBound,
            supportScore: simulationA.supporters.length * 25,
            topResistance: simulationA.resistors[0]?.name ?? 'Unknown',
          },
          simulationB: {
            id: simulationB.id,
            prescription_id: simulationB.prescription_id,
            prescription: {
              title: simulationB.prescription_title,
              costEstimate: 'N/A',
            },
            expectedValue: simulationB.expectedValue,
            confidenceLevel: simulationB.confidenceLevel,
            optimisticBound: simulationB.optimisticBound,
            pessimisticBound: simulationB.pessimisticBound,
            supportScore: simulationB.supporters.length * 25,
            topResistance: simulationB.resistors[0]?.name ?? 'Unknown',
          },
          country,
          sector,
        }),
      })
      const data = await res.json()
      setOpinion(data.opinion ?? 'Unable to generate opinion.')
      setGenerated(true)
    } catch {
      setOpinion('Deep Simulation comparison — coming soon. MiroFish is not yet connected.')
      setGenerated(true)
    } finally {
      setLoading(false)
    }
  }, [simulationA, simulationB, country, sector])

  if (!open) return null

  const metrics: MetricRow[] = [
    {
      label: 'Expected gap closure',
      a: `${simulationA.expectedValue}%`,
      b: `${simulationB.expectedValue}%`,
      aWins: simulationA.expectedValue > simulationB.expectedValue,
    },
    {
      label: 'Confidence',
      a: simulationA.confidenceLevel,
      b: simulationB.confidenceLevel,
      aWins: ['high', 'medium', 'low'].indexOf(simulationA.confidenceLevel) <
        ['high', 'medium', 'low'].indexOf(simulationB.confidenceLevel),
    },
    {
      label: 'Optimistic bound',
      a: `${simulationA.optimisticBound}%`,
      b: `${simulationB.optimisticBound}%`,
      aWins: simulationA.optimisticBound > simulationB.optimisticBound,
    },
    {
      label: 'Pessimistic bound',
      a: `${simulationA.pessimisticBound}%`,
      b: `${simulationB.pessimisticBound}%`,
      aWins: simulationA.pessimisticBound > simulationB.pessimisticBound,
    },
    {
      label: 'Stakeholder support',
      a: `${simulationA.supporters.length * 25}%`,
      b: `${simulationB.supporters.length * 25}%`,
      aWins: simulationA.supporters.length > simulationB.supporters.length,
    },
  ]

  const paragraphs = opinion?.split('\n\n').filter((p) => p.trim()) ?? []
  const actionParagraph = paragraphs.length >= 3 ? paragraphs[2] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-y-auto mx-4">
        <div className="sticky top-0 bg-white z-10 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display text-lg text-slate-900">Scenario Comparison</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Section 1 — Side by side metrics */}
          <section>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">
              Side-by-Side Metrics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-slate-400 font-medium text-xs uppercase">Metric</th>
                    <th className="text-right py-2 px-3 font-medium text-xs uppercase" style={{ color: accentColor }}>
                      {simulationA.prescription_title}
                    </th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium text-xs uppercase">
                      {simulationB.prescription_title}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m) => (
                    <tr key={m.label} className="border-b border-slate-50">
                      <td className="py-2.5 px-3 text-slate-700">{m.label}</td>
                      <td
                        className="py-2.5 px-3 text-right font-mono"
                        style={m.aWins ? { backgroundColor: `${accentColor}10`, color: accentColor } : undefined}
                      >
                        {m.a}
                      </td>
                      <td
                        className="py-2.5 px-3 text-right font-mono"
                        style={!m.aWins ? { backgroundColor: `${accentColor}10`, color: accentColor } : undefined}
                      >
                        {m.b}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 2 — Syrka's Educated Opinion */}
          <section>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">
              Syrka&apos;s Educated Opinion
            </h3>

            {!generated && (
              <button
                type="button"
                onClick={generateOpinion}
                disabled={loading}
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Generating opinion...' : 'Generate Educated Opinion'}
              </button>
            )}

            {opinion && (
              <div className="space-y-4">
                {paragraphs.slice(0, 2).map((p, i) => (
                  <p key={i} className="text-sm text-slate-600 leading-relaxed">
                    {i === 0 ? (
                      <>
                        <span style={{ color: accentColor }} className="font-semibold">
                          {p.split('.')[0]}.
                        </span>
                        {p.slice(p.indexOf('.') + 1)}
                      </>
                    ) : (
                      p
                    )}
                  </p>
                ))}
              </div>
            )}
          </section>

          {/* Section 3 — 30-day action */}
          {actionParagraph && (
            <section
              className="rounded-xl border-2 px-6 py-5"
              style={{ borderColor: accentColor, backgroundColor: `${accentColor}05` }}
            >
              <p
                className="text-xs font-medium uppercase tracking-wide mb-2"
                style={{ color: accentColor }}
              >
                Next step — do this in the next 30 days
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{actionParagraph}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
