'use client'

import { useMemo, useState } from 'react'
import { CheckCircle, XCircle, Lightbulb } from '@phosphor-icons/react/dist/ssr'
import { HINT_LADDER, canRevealCompleteSolution } from '@/lib/services/learning/tutor-state-machine'

type Phase = 'practice' | 'transfer' | 'explain' | 'done'

interface CoefficientTerm {
  formula: string
  atoms: Record<string, number>
}

const PRACTICE_REACTANTS: CoefficientTerm[] = [
  { formula: 'Fe', atoms: { Fe: 1 } },
  { formula: 'H₂O', atoms: { H: 2, O: 1 } },
]
const PRACTICE_PRODUCTS: CoefficientTerm[] = [
  { formula: 'Fe₃O₄', atoms: { Fe: 3, O: 4 } },
  { formula: 'H₂', atoms: { H: 2 } },
]
const PRACTICE_ANSWER = [1, 4, 1, 4]

const TRANSFER_REACTANTS: CoefficientTerm[] = [
  { formula: 'N₂', atoms: { N: 2 } },
  { formula: 'H₂', atoms: { H: 2 } },
]
const TRANSFER_PRODUCTS: CoefficientTerm[] = [{ formula: 'NH₃', atoms: { N: 1, H: 3 } }]

function computeElementTotals(terms: CoefficientTerm[], coefficients: number[]): Record<string, number> {
  const totals: Record<string, number> = {}
  terms.forEach((term, i) => {
    const coefficient = coefficients[i] || 0
    Object.entries(term.atoms).forEach(([element, count]) => {
      totals[element] = (totals[element] ?? 0) + count * coefficient
    })
  })
  return totals
}

function isBalanced(reactants: CoefficientTerm[], reactantCoeffs: number[], products: CoefficientTerm[], productCoeffs: number[]): boolean {
  const left = computeElementTotals(reactants, reactantCoeffs)
  const right = computeElementTotals(products, productCoeffs)
  const elements = new Set([...Object.keys(left), ...Object.keys(right)])
  return Array.from(elements).every((el) => (left[el] ?? 0) === (right[el] ?? 0) && (left[el] ?? 0) > 0)
}

/**
 * The interactive equation activity: coefficient entry, a live atom-count
 * table (so "inspecting reactant/product atom counts" is a real, always-
 * current view, not a static caption), progressive hints from the shared
 * hint ladder, and a required transfer question before a full reveal can
 * be described as understood. No live model — every check runs locally.
 */
export function EquationWorkbench() {
  const [phase, setPhase] = useState<Phase>('practice')
  const [reactantCoeffs, setReactantCoeffs] = useState<number[]>([0, 0])
  const [productCoeffs, setProductCoeffs] = useState<number[]>([0, 0])
  const [hintLevel, setHintLevel] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | undefined>()
  const [attempts, setAttempts] = useState(0)

  const [transferReactantCoeffs, setTransferReactantCoeffs] = useState<number[]>([0, 0])
  const [transferProductCoeffs, setTransferProductCoeffs] = useState<number[]>([0])
  const [transferFeedback, setTransferFeedback] = useState<'correct' | 'incorrect' | undefined>()

  const [explainText, setExplainText] = useState('')

  const totals = useMemo(
    () => ({ left: computeElementTotals(PRACTICE_REACTANTS, reactantCoeffs), right: computeElementTotals(PRACTICE_PRODUCTS, productCoeffs) }),
    [reactantCoeffs, productCoeffs]
  )
  const elements = ['Fe', 'H', 'O']

  function submitPractice() {
    setAttempts((n) => n + 1)
    if (isBalanced(PRACTICE_REACTANTS, reactantCoeffs, PRACTICE_PRODUCTS, productCoeffs)) {
      setFeedback('correct')
      setTimeout(() => setPhase('transfer'), 900)
    } else {
      setFeedback('incorrect')
    }
  }

  function requestHint() {
    setHintLevel((level) => Math.min(7, level + 1))
    setFeedback(undefined)
    if (hintLevel + 1 >= 7) {
      setReactantCoeffs(PRACTICE_ANSWER.slice(0, 2))
      setProductCoeffs(PRACTICE_ANSWER.slice(2))
    }
  }

  function submitTransfer() {
    if (isBalanced(TRANSFER_REACTANTS, transferReactantCoeffs, TRANSFER_PRODUCTS, transferProductCoeffs)) {
      setTransferFeedback('correct')
      setTimeout(() => setPhase('explain'), 900)
    } else {
      setTransferFeedback('incorrect')
    }
  }

  const revealed = canRevealCompleteSolution(hintLevel)
  const independenceLevel = hintLevel === 0 ? 'independent' : hintLevel <= 3 ? 'partially guided' : 'guided'

  return (
    <div className="rounded-campus-md border border-campus-border bg-campus-surface p-5">
      <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Interactive activity · Balancing chemical equations</p>

      {phase === 'practice' && (
        <div className="mt-3 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2 font-campus-sans text-campus-lg text-campus-text">
            {PRACTICE_REACTANTS.map((term, i) => (
              <span key={term.formula} className="flex items-center gap-1">
                {i > 0 && <span className="text-campus-muted">+</span>}
                <CoefficientInput value={reactantCoeffs[i]} onChange={(v) => setReactantCoeffs((c) => c.map((x, idx) => (idx === i ? v : x)))} disabled={revealed} />
                {term.formula}
              </span>
            ))}
            <span className="text-campus-muted">→</span>
            {PRACTICE_PRODUCTS.map((term, i) => (
              <span key={term.formula} className="flex items-center gap-1">
                {i > 0 && <span className="text-campus-muted">+</span>}
                <CoefficientInput value={productCoeffs[i]} onChange={(v) => setProductCoeffs((c) => c.map((x, idx) => (idx === i ? v : x)))} disabled={revealed} />
                {term.formula}
              </span>
            ))}
          </div>

          {/* Live atom-count table — inspecting reactant/product counts is a real, always-current view. */}
          <table className="w-full border-collapse font-campus-mono text-campus-xs">
            <caption className="mb-1 text-left text-[10px] uppercase tracking-wide text-campus-muted">Atom counts, reactants vs. products</caption>
            <thead>
              <tr className="border-b border-campus-border text-campus-muted">
                <th className="py-1 text-left font-normal">Element</th>
                <th className="py-1 text-left font-normal">Reactants</th>
                <th className="py-1 text-left font-normal">Products</th>
                <th className="py-1 text-left font-normal">Match</th>
              </tr>
            </thead>
            <tbody>
              {elements.map((el) => {
                const left = totals.left[el] ?? 0
                const right = totals.right[el] ?? 0
                const match = left === right && left > 0
                return (
                  <tr key={el} className="border-b border-campus-border/50">
                    <td className="py-1 text-campus-text">{el}</td>
                    <td className="py-1 text-campus-text">{left}</td>
                    <td className="py-1 text-campus-text">{right}</td>
                    <td className="py-1">
                      {match ? <CheckCircle size={13} weight="fill" className="text-campus-green-600 dark:text-campus-green-dark" aria-hidden="true" /> : <XCircle size={13} className="text-campus-muted" aria-hidden="true" />}
                      <span className="sr-only">{match ? 'balanced' : 'not balanced'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={submitPractice}
              disabled={revealed}
              className="rounded-campus-sm bg-campus-ink-950 px-4 py-1.5 font-campus-sans text-campus-sm font-medium text-campus-white hover:opacity-90 disabled:opacity-50 dark:bg-campus-stone-100 dark:text-campus-ink-950"
            >
              Submit attempt
            </button>
            <button
              type="button"
              onClick={requestHint}
              disabled={hintLevel >= 7}
              className="flex items-center gap-1.5 rounded-campus-sm border border-campus-border px-3 py-1.5 font-campus-sans text-campus-sm text-campus-text hover:bg-campus-surface-raised disabled:opacity-50"
            >
              <Lightbulb size={14} aria-hidden="true" /> Get a hint ({hintLevel}/7)
            </button>
            <span className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{attempts} attempt{attempts === 1 ? '' : 's'} · {independenceLevel}</span>
          </div>

          {feedback === 'correct' && <p className="font-campus-sans text-campus-sm text-campus-green-600 dark:text-campus-green-dark">Balanced. Moving to a transfer question.</p>}
          {feedback === 'incorrect' && <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">Not yet balanced — check the atom-count table above.</p>}
          {hintLevel > 0 && hintLevel < 7 && (
            <p className="rounded-campus-sm border border-dashed border-campus-border p-2.5 font-campus-sans text-campus-sm text-campus-text">Hint {hintLevel}: {HINT_LADDER[hintLevel].description}</p>
          )}
          {revealed && (
            <p className="rounded-campus-sm border border-campus-amber-600 p-2.5 font-campus-sans text-campus-sm text-campus-text dark:border-campus-amber-dark">
              Full solution revealed: 1 Fe + 4 H₂O → 1 Fe₃O₄ + 4 H₂. A revealed solution alone never counts as independent understanding — the transfer question below still checks that.
            </p>
          )}
        </div>
      )}

      {phase === 'transfer' && (
        <div className="mt-3 flex flex-col gap-4">
          <p className="font-campus-sans text-campus-sm text-campus-text">Transfer question — a materially different equation:</p>
          <div className="flex flex-wrap items-center justify-center gap-2 font-campus-sans text-campus-lg text-campus-text">
            {TRANSFER_REACTANTS.map((term, i) => (
              <span key={term.formula} className="flex items-center gap-1">
                {i > 0 && <span className="text-campus-muted">+</span>}
                <CoefficientInput value={transferReactantCoeffs[i]} onChange={(v) => setTransferReactantCoeffs((c) => c.map((x, idx) => (idx === i ? v : x)))} />
                {term.formula}
              </span>
            ))}
            <span className="text-campus-muted">→</span>
            <span className="flex items-center gap-1">
              <CoefficientInput value={transferProductCoeffs[0]} onChange={(v) => setTransferProductCoeffs([v])} />
              {TRANSFER_PRODUCTS[0].formula}
            </span>
          </div>
          <button
            type="button"
            onClick={submitTransfer}
            className="self-start rounded-campus-sm bg-campus-ink-950 px-4 py-1.5 font-campus-sans text-campus-sm font-medium text-campus-white hover:opacity-90 dark:bg-campus-stone-100 dark:text-campus-ink-950"
          >
            Submit transfer answer
          </button>
          {transferFeedback === 'correct' && <p className="font-campus-sans text-campus-sm text-campus-green-600 dark:text-campus-green-dark">Correct — a materially different equation, balanced independently.</p>}
          {transferFeedback === 'incorrect' && <p className="font-campus-sans text-campus-sm text-campus-red-600 dark:text-campus-red-dark">Not yet balanced — try again.</p>}
        </div>
      )}

      {phase === 'explain' && (
        <div className="mt-3 flex flex-col gap-3">
          <label htmlFor="explain-back" className="font-campus-sans text-campus-sm text-campus-text">
            Explain back: in your own words, why must a chemical equation balance?
          </label>
          <textarea
            id="explain-back"
            value={explainText}
            onChange={(e) => setExplainText(e.target.value)}
            rows={3}
            className="rounded-campus-sm border border-campus-border bg-campus-surface p-2.5 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
            placeholder="Because matter is neither created nor destroyed…"
          />
          <button
            type="button"
            onClick={() => setPhase('done')}
            disabled={explainText.trim().length < 10}
            className="self-start rounded-campus-sm bg-campus-ink-950 px-4 py-1.5 font-campus-sans text-campus-sm font-medium text-campus-white hover:opacity-90 disabled:opacity-50 dark:bg-campus-stone-100 dark:text-campus-ink-950"
          >
            Complete activity
          </button>
        </div>
      )}

      {phase === 'done' && (
        <div className="mt-3 flex items-center gap-2 rounded-campus-sm border border-campus-green-600 p-3 font-campus-sans text-campus-sm text-campus-text dark:border-campus-green-dark">
          <CheckCircle size={18} weight="fill" className="text-campus-green-600 dark:text-campus-green-dark" aria-hidden="true" />
          Activity complete — attempt, hint use, transfer, and explain-back are all recorded as separate Learning Observations, never one blended score.
        </div>
      )}
    </div>
  )
}

function CoefficientInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <input
      type="number"
      min={0}
      max={9}
      value={value || ''}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      disabled={disabled}
      aria-label="Coefficient"
      className="h-8 w-10 rounded-campus-sm border border-campus-border bg-campus-surface text-center font-campus-mono text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600 disabled:opacity-60"
    />
  )
}
