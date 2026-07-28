'use client'

import { useState } from 'react'
import { DesmosLearningGraph } from './DesmosLearningGraph'
import { getEconomicsRepaymentDesmosConfig } from '@/lib/services/learning/economics-desmos-config'

type Source = 'bank' | 'moneylender'
type Collateral = 'none' | 'land'

const SOURCE_INFO: Record<Source, { label: string; rate: number; documentation: string; speed: string }> = {
  bank: { label: 'Bank / cooperative (formal)', rate: 0.1, documentation: 'Requires proof of income, identity documents, and usually collateral or a guarantor.', speed: 'Slower — approval can take days to weeks.' },
  moneylender: { label: 'Moneylender / trader (informal)', rate: 0.3, documentation: 'Little to no paperwork — often a verbal or informal agreement.', speed: 'Fast — funds are often available the same day.' },
}

const principal = 8000
const months = 12

function computeOwed(rate: number): number {
  return Math.round(principal * (1 + (rate * months) / 12))
}

/**
 * LEARN-002 §13 — the one bespoke subject interactive this pass ships:
 * a real credit-source comparison for Economics "Money and Credit",
 * grounded in the chapter's own formal-vs-informal-credit distinction.
 * The bargaining-power consequence (collateral changes what a formal
 * lender will offer) is computed from the student's own choices, not
 * hard-coded narrative text.
 */
export function EconomicsCreditSimulator() {
  const [source, setSource] = useState<Source>()
  const [collateral, setCollateral] = useState<Collateral>()
  const [transferResponse, setTransferResponse] = useState('')
  const [showDesmos, setShowDesmos] = useState(false)

  const info = source ? SOURCE_INFO[source] : undefined
  const owed = info ? computeOwed(info.rate) : undefined
  const bankWillLendWithoutCollateral = collateral === 'land'

  return (
    <div className="flex flex-col gap-4 rounded-campus-md border border-campus-border bg-campus-surface p-5">
      <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Interactive — household borrowing simulator</p>
      <p className="font-campus-sans text-campus-sm text-campus-text">
        A household needs to borrow ₹{principal.toLocaleString('en-IN')} for {months} months. Choose a credit source, then whether they have land to offer as collateral.
      </p>

      <div>
        <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">1. Choose a credit source</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(Object.keys(SOURCE_INFO) as Source[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSource(key)}
              aria-pressed={source === key}
              className={`rounded-campus-sm border p-3 text-left transition-colors ${
                source === key ? 'border-campus-ink-950 bg-campus-surface-raised dark:border-campus-stone-100' : 'border-campus-border hover:bg-campus-surface-raised'
              }`}
            >
              <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{SOURCE_INFO[key].label}</p>
              <p className="mt-0.5 font-campus-mono text-[10px] text-campus-muted">{Math.round(SOURCE_INFO[key].rate * 100)}% per year</p>
            </button>
          ))}
        </div>
      </div>

      {source && (
        <div>
          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">2. Does the household have land to offer as collateral?</p>
          <div className="mt-2 flex gap-2">
            {(['none', 'land'] as Collateral[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCollateral(c)}
                aria-pressed={collateral === c}
                className={`rounded-campus-sm border px-3 py-1.5 font-campus-sans text-campus-sm ${
                  collateral === c ? 'border-campus-ink-950 bg-campus-surface-raised dark:border-campus-stone-100' : 'border-campus-border hover:bg-campus-surface-raised'
                }`}
              >
                {c === 'none' ? 'No collateral' : 'Yes — land'}
              </button>
            ))}
          </div>
        </div>
      )}

      {info && collateral && owed && (
        <div className="flex flex-col gap-2 border-t border-campus-border pt-4">
          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Consequence</p>
          <p className="font-campus-sans text-campus-sm text-campus-text">{info.documentation} {info.speed}</p>
          <p className="font-campus-sans text-campus-sm text-campus-text">
            Total owed after {months} months at {Math.round(info.rate * 100)}%: <span className="font-campus-mono tabular-nums">₹{owed.toLocaleString('en-IN')}</span>
          </p>
          {source === 'bank' && (
            <p className="font-campus-sans text-campus-xs text-campus-text">
              {bankWillLendWithoutCollateral
                ? 'With land as collateral, the bank\'s bargaining position improves for the household — it can now qualify for the lower formal rate.'
                : 'Without collateral, a bank may refuse the loan outright or require a guarantor — this is exactly why some households turn to informal credit despite the higher rate.'}
            </p>
          )}
          {source === 'moneylender' && (
            <p className="font-campus-sans text-campus-xs text-campus-text">
              A moneylender rarely asks for collateral, which is the trade-off: speed and low documentation, in exchange for a substantially higher rate.
            </p>
          )}

          <button type="button" onClick={() => setShowDesmos((v) => !v)} className="mt-1 self-start font-campus-sans text-campus-xs font-medium text-campus-blue-600 hover:underline dark:text-campus-blue-dark">
            {showDesmos ? 'Hide' : 'Show'} the repayment-burden graph
          </button>
          {showDesmos && <DesmosLearningGraph {...getEconomicsRepaymentDesmosConfig()} />}
        </div>
      )}

      {info && collateral && (
        <div className="border-t border-campus-border pt-4">
          <p className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Independent transfer</p>
          <p className="mt-1 font-campus-sans text-campus-sm text-campus-text">
            A different household has no land but urgently needs the money within a day. Which source would you recommend, and what is the real trade-off they are accepting?
          </p>
          <textarea
            value={transferResponse}
            onChange={(e) => setTransferResponse(e.target.value)}
            rows={3}
            placeholder="Your recommendation and reasoning…"
            className="mt-2 w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
          {transferResponse.trim().length > 20 && (
            <p className="font-campus-sans text-campus-xs text-campus-muted">
              This exploratory interactive is not connected to the concept&rsquo;s own Evidence chain — complete the Test step below for a transfer attempt that counts toward Evidence.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
