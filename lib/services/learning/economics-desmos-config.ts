import type { DesmosExpression } from '@/components/learning/visuals/DesmosLearningGraph'

/**
 * LEARN-002 §11 — the one Desmos demonstration this pass ships: total
 * repayment (y) as a function of months (x) for a fixed principal at two
 * different annual interest rates, attached to Economics "Money and
 * Credit". A genuinely graphable relationship — not forced onto a
 * literary or civic concept.
 */
export interface EconomicsRepaymentDesmosConfig {
  title: string
  description: string
  expressions: DesmosExpression[]
  viewport: { left: number; right: number; bottom: number; top: number }
  structuredFallback: { label: string; value: string }[]
}

export function getEconomicsRepaymentDesmosConfig(): EconomicsRepaymentDesmosConfig {
  const principal = 10000
  return {
    title: 'Repayment burden — principal ₹10,000',
    description: 'Total amount owed as months pass, at a formal-credit rate (10% p.a.) versus a typical informal-credit rate (30% p.a.). Drag along either line to see the amount owed at that point.',
    expressions: [
      { id: 'formal', latex: `y=${principal}(1+0.10x/12)`, color: '#2563eb' },
      { id: 'informal', latex: `y=${principal}(1+0.30x/12)`, color: '#dc2626' },
      { id: 'principal-line', latex: `y=${principal}`, color: '#9ca3af' },
    ],
    viewport: { left: 0, right: 24, bottom: 8000, top: 20000 },
    structuredFallback: [
      { label: 'Principal', value: `₹${principal.toLocaleString('en-IN')}` },
      { label: 'Formal credit rate', value: '10% per year' },
      { label: 'Informal credit rate', value: '30% per year' },
      { label: 'Owed after 12 months (formal)', value: `₹${Math.round(principal * (1 + 0.1)).toLocaleString('en-IN')}` },
      { label: 'Owed after 12 months (informal)', value: `₹${Math.round(principal * (1 + 0.3)).toLocaleString('en-IN')}` },
      { label: 'Owed after 24 months (formal)', value: `₹${Math.round(principal * (1 + 0.2)).toLocaleString('en-IN')}` },
      { label: 'Owed after 24 months (informal)', value: `₹${Math.round(principal * (1 + 0.6)).toLocaleString('en-IN')}` },
    ],
  }
}
