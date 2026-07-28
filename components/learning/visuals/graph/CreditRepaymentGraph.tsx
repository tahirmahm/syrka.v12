'use client'

import { useMemo, useState } from 'react'
import { Plot, Point, Line, useMovablePoint } from 'mafs'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SyrkaMafsGraph } from './SyrkaMafsGraph'
import { InteractiveParameter } from './InteractiveParameter'

type Stage = 'predict' | 'explore' | 'transfer'

function owedAt(principal: number, annualRatePct: number, months: number): number {
  return principal * (1 + (annualRatePct / 100) * (months / 12))
}

function formatRupees(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

/**
 * LEARN-002 interactive-graph pass — the required first Mafs interactive,
 * replacing the previous static Desmos-only route for "Formal vs. informal
 * credit". A learner-controlled principal, formal rate, informal rate and
 * repayment period drive two live repayment curves; a draggable point
 * constrained to the informal curve lets the learner inspect any month
 * directly, in addition to the numeric/keyboard controls every parameter
 * also has. This is a labelled learning simulation, not a claim that every
 * real loan follows this formula.
 */
export function CreditRepaymentGraph() {
  const [stage, setStage] = useState<Stage>('predict')
  const [prediction, setPrediction] = useState<'formal' | 'informal' | null>(null)
  const [principal, setPrincipal] = useState(20000)
  const [formalRate, setFormalRate] = useState(10)
  const [informalRate, setInformalRate] = useState(30)
  const [period, setPeriod] = useState(12)
  const [explanation, setExplanation] = useState('')
  const [transferAnswer, setTransferAnswer] = useState('')

  const inspector = useMovablePoint([period, owedAt(principal, informalRate, period)], {
    constrain: (attempted) => {
      const month = Math.min(period, Math.max(0, Math.round(attempted[0])))
      return [month, owedAt(principal, informalRate, month)]
    },
    color: 'var(--campus-red-600)',
  })
  const inspectedMonth = Math.round(inspector.x)
  const formalAtInspected = owedAt(principal, formalRate, inspectedMonth)
  const informalAtInspected = owedAt(principal, informalRate, inspectedMonth)
  const gapAtInspected = informalAtInspected - formalAtInspected

  const maxY = useMemo(() => owedAt(principal, Math.max(formalRate, informalRate), period) * 1.08, [principal, formalRate, informalRate, period])

  const revealed = stage !== 'predict'

  return (
    <div className="flex flex-col gap-4 rounded-campus-md border border-campus-border bg-campus-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Interactive graph — repayment comparison</p>
        <Badge tone="neutral">Learning simulation</Badge>
      </div>

      {stage === 'predict' && (
        <div className="flex flex-col gap-3">
          <p className="font-campus-sans text-campus-sm text-campus-text">
            A household borrows {formatRupees(principal)} for {period} months. One lender is a bank or cooperative (formal, lower rate, needs documentation or collateral); the other is a moneylender
            (informal, easier and faster, higher rate). <strong>Before seeing the graph</strong>: which one ends up costing more to repay, and why?
          </p>
          <div className="flex gap-2">
            {(['formal', 'informal'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={prediction === opt}
                onClick={() => setPrediction(opt)}
                className={`rounded-campus-sm border px-3 py-1.5 font-campus-sans text-campus-sm capitalize ${
                  prediction === opt ? 'border-campus-ink-950 bg-campus-surface-raised dark:border-campus-stone-100' : 'border-campus-border hover:bg-campus-surface-raised'
                }`}
              >
                {opt} credit costs more
              </button>
            ))}
          </div>
          <Button size="sm" disabled={!prediction} onClick={() => setStage('explore')} className="self-start">
            See the graph
          </Button>
        </div>
      )}

      {revealed && (
        <>
          {prediction && (
            <p className="font-campus-sans text-campus-xs text-campus-muted">
              Your prediction: <span className="font-medium text-campus-text">{prediction} credit costs more</span>. Watch where the two curves separate below.
            </p>
          )}

          <SyrkaMafsGraph
            height={320}
            viewBox={{ x: [0, period], y: [principal * 0.9, maxY], padding: 0 }}
            ariaLabel={`Repayment graph: total amount owed over ${period} months for a ₹${principal} loan, at ${formalRate}% formal and ${informalRate}% informal annual interest.`}
          >
            <Plot.OfX y={(x) => owedAt(principal, formalRate, x)} domain={[0, period]} color="var(--campus-blue-600)" />
            <Plot.OfX y={(x) => owedAt(principal, informalRate, x)} domain={[0, period]} color="var(--campus-red-600)" />
            <Line.Segment point1={[0, principal]} point2={[period, principal]} color="var(--campus-stone-500)" />
            {inspector.element}
            <Point x={inspectedMonth} y={formalAtInspected} color="var(--campus-blue-600)" />
          </SyrkaMafsGraph>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-campus-sm border border-campus-border p-2.5">
              <p className="font-campus-mono text-[9px] uppercase tracking-wide text-campus-muted">Month</p>
              <p className="font-campus-mono text-campus-sm tabular-nums text-campus-text">{inspectedMonth}</p>
            </div>
            <div className="rounded-campus-sm border border-campus-blue-600/30 p-2.5">
              <p className="font-campus-mono text-[9px] uppercase tracking-wide text-campus-blue-600 dark:text-campus-blue-dark">Formal owed</p>
              <p className="font-campus-mono text-campus-sm tabular-nums text-campus-text">{formatRupees(formalAtInspected)}</p>
            </div>
            <div className="rounded-campus-sm border border-campus-red-600/30 p-2.5">
              <p className="font-campus-mono text-[9px] uppercase tracking-wide text-campus-red-600 dark:text-campus-red-dark">Informal owed</p>
              <p className="font-campus-mono text-campus-sm tabular-nums text-campus-text">{formatRupees(informalAtInspected)}</p>
            </div>
            <div className="rounded-campus-sm border border-campus-border p-2.5">
              <p className="font-campus-mono text-[9px] uppercase tracking-wide text-campus-muted">Gap at this month</p>
              <p className="font-campus-mono text-campus-sm tabular-nums text-campus-text">{formatRupees(gapAtInspected)}</p>
            </div>
          </div>
          <p className="font-campus-sans text-campus-xs text-campus-muted">Drag the red point along the informal curve, or use the controls below, to inspect any month.</p>

          <div className="grid gap-3 border-t border-campus-border pt-3 sm:grid-cols-2">
            <InteractiveParameter label="Principal" value={principal} min={5000} max={50000} step={1000} onChange={setPrincipal} formatValue={formatRupees} />
            <InteractiveParameter label="Repayment period" value={period} min={3} max={36} step={1} unit=" months" onChange={setPeriod} />
            <InteractiveParameter label="Formal rate" value={formalRate} min={6} max={18} step={1} unit="% / year" onChange={setFormalRate} />
            <InteractiveParameter label="Informal rate" value={informalRate} min={18} max={60} step={1} unit="% / year" onChange={setInformalRate} />
          </div>

          {stage === 'explore' && (
            <div className="border-t border-campus-border pt-3">
              <p className="mb-1.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Explain</p>
              <p className="mb-1.5 font-campus-sans text-campus-sm text-campus-text">
                Increase the informal rate and watch the curves. Why does the gap between formal and informal repayment grow faster the longer the loan runs, rather than growing at a constant rate?
              </p>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={3}
                placeholder="Your explanation…"
                className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
              />
              <Button size="sm" className="mt-2" disabled={explanation.trim().length < 15} onClick={() => setStage('transfer')}>
                Continue to transfer question
              </Button>
            </div>
          )}

          {stage === 'transfer' && (
            <div className="border-t border-campus-border pt-3">
              <p className="mb-1.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Independent transfer — no graph this time</p>
              <p className="mb-1.5 font-campus-sans text-campus-sm text-campus-text">
                A different household borrows ₹15,000 for 18 months. A cooperative bank offers 12% per year; a moneylender offers 40% per year. Without redrawing the graph, estimate roughly how much
                more the informal loan will cost by month 18, and explain your reasoning.
              </p>
              <textarea
                value={transferAnswer}
                onChange={(e) => setTransferAnswer(e.target.value)}
                rows={3}
                placeholder="Your estimate and reasoning…"
                className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
              />
              {transferAnswer.trim().length > 20 && (
                <p className="mt-1.5 font-campus-sans text-campus-xs text-campus-muted">
                  This exploratory interactive is not connected to the concept&rsquo;s own Evidence chain — complete the Test step below for a transfer attempt that counts toward Evidence.
                </p>
              )}
            </div>
          )}

          <details className="border-t border-campus-border pt-3">
            <summary className="cursor-pointer font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Structured table equivalent</summary>
            <table className="mt-2 w-full text-left font-campus-mono text-campus-xs text-campus-text">
              <thead>
                <tr className="border-b border-campus-border">
                  <th scope="col" className="py-1 pr-3 font-normal text-campus-muted">Month</th>
                  <th scope="col" className="py-1 pr-3 font-normal text-campus-muted">Formal owed</th>
                  <th scope="col" className="py-1 font-normal text-campus-muted">Informal owed</th>
                </tr>
              </thead>
              <tbody>
                {[0, Math.round(period / 4), Math.round(period / 2), Math.round((3 * period) / 4), period].map((m) => (
                  <tr key={m} className="border-t border-campus-border">
                    <td className="py-1 pr-3 tabular-nums">{m}</td>
                    <td className="py-1 pr-3 tabular-nums">{formatRupees(owedAt(principal, formalRate, m))}</td>
                    <td className="py-1 tabular-nums">{formatRupees(owedAt(principal, informalRate, m))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  )
}
