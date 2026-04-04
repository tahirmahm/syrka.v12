'use client'

import { useState, useCallback } from 'react'
import { X } from 'lucide-react'
import dynamic from 'next/dynamic'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StakeholderGroup {
  name: string
  reason: string
  strength: 'Weak' | 'Moderate' | 'Strong'
}

export interface SimulationResult {
  id: string
  prescription_id: string
  prescription_title: string
  expectedValue: number
  optimisticBound: number
  pessimisticBound: number
  confidenceLevel: 'low' | 'medium' | 'high'
  supporters: StakeholderGroup[]
  resistors: StakeholderGroup[]
  criticalSuccessFactors: string[]
  failureModes: string[]
  unintendedConsequences: string[]
  country: string
  sector: string
}

interface SimulationBriefDrawerProps {
  result: SimulationResult | null
  open: boolean
  onClose: () => void
  accentColor: string
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ConfidenceBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const config = {
    high: { classes: 'bg-emerald-500/10 text-emerald-500', text: 'High confidence — narrow outcome range' },
    medium: { classes: 'bg-amber-500/10 text-amber-500', text: 'Medium confidence — moderate scenario variance' },
    low: { classes: 'bg-red-500/10 text-red-500', text: 'Low confidence — wide outcome range, high uncertainty' },
  }
  const c = config[level]
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${c.classes}`}>
      {c.text}
    </span>
  )
}

function StakeholderCard({ group, type }: { group: StakeholderGroup; type: 'support' | 'resist' }) {
  const strengthColors = {
    support: { Weak: 'bg-emerald-100 text-emerald-600', Moderate: 'bg-emerald-200 text-emerald-700', Strong: 'bg-emerald-300 text-emerald-800' },
    resist: { Weak: 'bg-red-100 text-red-600', Moderate: 'bg-red-200 text-red-700', Strong: 'bg-red-300 text-red-800' },
  }
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-800">{group.name}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${strengthColors[type][group.strength]}`}>
          {group.strength}
        </span>
      </div>
      <p className="text-xs text-slate-500">{group.reason}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Drawer                                                             */
/* ------------------------------------------------------------------ */

export default function SimulationBriefDrawer({
  result,
  open,
  onClose,
  accentColor,
}: SimulationBriefDrawerProps) {
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const handleChat = useCallback(async () => {
    if (!chatInput.trim() || !result) return

    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)

    try {
      const res = await fetch('/api/mirofish/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          simulation: result,
          system_prompt: `You are roleplaying as a stakeholder in a simulation of ${result.prescription_title} in ${result.country}. Based on their position in the simulation data provided, respond in character as that stakeholder. Be specific about their concerns, incentives, and constraints. 2-3 sentences maximum.`,
        }),
      })
      const data = await res.json()
      const reply = data.response ?? data.error ?? 'Unable to respond at this time.'
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Deep Simulation — coming soon. MiroFish is not yet connected.' },
      ])
    } finally {
      setChatLoading(false)
    }
  }, [chatInput, result])

  if (!open || !result) return null

  const rangeChartOption = {
    xAxis: {
      type: 'value' as const,
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%', color: '#8B95A8', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    yAxis: {
      type: 'category' as const,
      data: ['Gap closure'],
      axisLabel: { color: '#0A1628', fontSize: 12 },
    },
    grid: { left: 100, right: 40, top: 20, bottom: 30 },
    series: [
      {
        type: 'bar' as const,
        data: [result.pessimisticBound],
        itemStyle: { color: 'transparent' },
        stack: 'a',
        barWidth: 28,
      },
      {
        type: 'bar' as const,
        data: [result.optimisticBound - result.pessimisticBound],
        itemStyle: { color: accentColor, opacity: 0.3 },
        stack: 'a',
        barWidth: 28,
        markLine: {
          symbol: 'none',
          data: [
            {
              xAxis: result.expectedValue,
              label: {
                formatter: `Expected: ${result.expectedValue}%`,
                position: 'end' as const,
                color: accentColor,
                fontSize: 12,
                fontWeight: 'bold' as const,
              },
              lineStyle: { color: accentColor, width: 2, type: 'solid' as const },
            },
          ],
        },
      },
    ],
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-2xl bg-white overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-5 border-b border-slate-100">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
          <h2 className="font-display text-lg text-slate-900 pr-8">{result.prescription_title}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulation complete — 5 anchor scenarios across 27 weighted outcomes
          </p>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* 1. Gap Closure Range */}
          <section>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Gap Closure Range</h3>
            <div className="h-[100px]">
              <ReactECharts option={rangeChartOption} style={{ height: '100%', width: '100%' }} />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-1 px-1">
              <span>Pessimistic: {result.pessimisticBound}%</span>
              <span>Optimistic: {result.optimisticBound}%</span>
            </div>
          </section>

          {/* 2. Confidence */}
          <section>
            <ConfidenceBadge level={result.confidenceLevel} />
          </section>

          {/* 3. Supporters */}
          <section>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Supporter Groups</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(result.supporters.length > 0
                ? result.supporters
                : [{ name: 'Insufficient simulation data', reason: '', strength: 'Weak' as const }]
              ).map((g, i) => (
                <StakeholderCard key={i} group={g} type="support" />
              ))}
            </div>
          </section>

          {/* 4. Resistors */}
          <section>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Resistance Groups</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(result.resistors.length > 0
                ? result.resistors
                : [{ name: 'Insufficient simulation data', reason: '', strength: 'Weak' as const }]
              ).map((g, i) => (
                <StakeholderCard key={i} group={g} type="resist" />
              ))}
            </div>
          </section>

          {/* 5. Critical Success Factors */}
          <section>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Critical Success Factors</h3>
            <ol className="space-y-2">
              {(result.criticalSuccessFactors.length > 0
                ? result.criticalSuccessFactors
                : ['Insufficient simulation data']
              ).map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-400">{i + 1}.</span>
                  {f}
                </li>
              ))}
            </ol>
          </section>

          {/* 6. Failure Modes */}
          <section>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Failure Modes</h3>
            <ol className="space-y-2">
              {(result.failureModes.length > 0
                ? result.failureModes
                : ['Insufficient simulation data']
              ).map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-400">{i + 1}.</span>
                  {f}
                </li>
              ))}
            </ol>
          </section>

          {/* 7. Unintended Consequences */}
          <section>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Unintended Consequences</h3>
            <ul className="space-y-1.5">
              {(result.unintendedConsequences.length > 0
                ? result.unintendedConsequences
                : ['Insufficient simulation data']
              ).map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="text-slate-300">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </section>

          {/* 8. Stakeholder Chat */}
          <section>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Stakeholder Chat</h3>

            {chatMessages.length > 0 && (
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-slate-100 text-slate-700 ml-8'
                        : 'bg-slate-50 border border-slate-100 text-slate-600 mr-8'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Ask any stakeholder in this simulation a question..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-300"
              />
              <button
                type="button"
                onClick={handleChat}
                disabled={chatLoading || !chatInput.trim()}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {chatLoading ? '...' : 'Send'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
