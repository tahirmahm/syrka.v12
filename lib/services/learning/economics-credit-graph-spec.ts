import type { LearningGraphSpec } from '@/lib/campus-types/learning-graph-spec'

/**
 * The authored LearningGraphSpec description backing CreditRepaymentGraph
 * — Syrka-authored deterministic, never DeepSeek-generated. Exists so
 * evaluateGraphInstructionalValue() has a real spec to validate against,
 * matching the same provenance discipline as Learning3DVisualSpec.
 */
export function getCreditRepaymentGraphSpec(): LearningGraphSpec {
  return {
    graphId: 'graph-eco-3-2-credit-repayment',
    schemaVersion: '1.0.0',
    conceptId: 'ncert-concept-eco-3-2',
    graphGrammar: 'repayment_schedule',
    learningObjective: 'Predict and explain why formal and informal credit repayment amounts diverge over time, then transfer the reasoning to a new principal/rate/period combination.',
    variables: [
      { id: 'principal', label: 'Principal', unit: '₹', role: 'learner_controlled' },
      { id: 'formalRate', label: 'Formal annual rate', unit: '%', role: 'learner_controlled' },
      { id: 'informalRate', label: 'Informal annual rate', unit: '%', role: 'learner_controlled' },
      { id: 'period', label: 'Repayment period', unit: 'months', role: 'learner_controlled' },
      { id: 'formalOwed', label: 'Formal amount owed', unit: '₹', role: 'derived' },
      { id: 'informalOwed', label: 'Informal amount owed', unit: '₹', role: 'derived' },
    ],
    parameters: [
      { variableId: 'principal', min: 5000, max: 50000, step: 1000, defaultValue: 20000 },
      { variableId: 'formalRate', min: 6, max: 18, step: 1, defaultValue: 10 },
      { variableId: 'informalRate', min: 18, max: 60, step: 1, defaultValue: 30 },
      { variableId: 'period', min: 3, max: 36, step: 1, defaultValue: 12 },
    ],
    functions: [
      { id: 'formal-curve', label: 'Formal credit', kind: 'simple_interest_repayment', color: 'blue', inputVariableIds: ['principal', 'formalRate'] },
      { id: 'informal-curve', label: 'Informal credit', kind: 'simple_interest_repayment', color: 'red', inputVariableIds: ['principal', 'informalRate'] },
    ],
    domain: { x: [0, 36], y: [0, 100000] },
    predictionPrompt: {
      id: 'predict-which-costs-more',
      prompt: 'Which one ends up costing more to repay, and why?',
      requiresPredictionBeforeReveal: true,
    },
    misconceptionTarget: 'A learner may assume the gap between formal and informal repayment grows at a constant rate (linearly) rather than widening faster the longer the loan runs, because both are simple-interest lines with different slopes.',
    assessmentHooks: [
      { id: 'hook-explain', purpose: 'explain_divergence', prompt: 'Why does the gap between formal and informal repayment grow faster the longer the loan runs?', requiresRemovalForIndependence: false },
      { id: 'hook-transfer', purpose: 'transfer', prompt: 'A different household borrows ₹15,000 for 18 months at 12% (formal) vs 40% (informal) — estimate the gap by month 18 without redrawing the graph.', requiresRemovalForIndependence: true },
    ],
    scaffoldingLevels: ['full', 'guided', 'independent'],
    structuredEquivalent: (state) => [
      { label: 'Principal', value: `₹${(state.principal ?? 20000).toLocaleString('en-IN')}` },
      { label: 'Formal rate', value: `${state.formalRate ?? 10}% / year` },
      { label: 'Informal rate', value: `${state.informalRate ?? 30}% / year` },
      { label: 'Repayment period', value: `${state.period ?? 12} months` },
    ],
    sourceReferenceIds: ['ncert-ref-eco-3'],
    provenance: 'faculty_authored_deterministic',
    renderer: 'mafs',
    performanceTier: 'standard',
  }
}
