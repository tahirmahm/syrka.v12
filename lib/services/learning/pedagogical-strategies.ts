import type { PedagogicalStrategy } from '@/lib/campus-types'

/**
 * Each subject's ordered catalogue of candidate strategies — the order
 * IS the deterministic diagnose -> change-strategy -> transfer
 * progression PedagogicalPolicyEngine walks through. No subject reuses
 * another's list verbatim; each reflects what the brief asks that
 * subject to optimise for (IAU-001 §7).
 */
export const SUBJECT_STRATEGY_CATALOG: Record<string, PedagogicalStrategy[]> = {
  English: ['source_close_reading', 'analogy', 'explain_back', 'transfer_task', 'delayed_retrieval'],
  Geography: ['classification_task', 'comparison', 'visual_representation', 'transfer_task', 'delayed_retrieval'],
  Economics: ['worked_example', 'counterexample', 'argument_counterargument', 'transfer_task', 'delayed_retrieval'],
  'Political Science': ['argument_counterargument', 'comparison', 'socratic_question', 'transfer_task', 'delayed_retrieval'],
}

export const STRATEGY_LABEL: Record<PedagogicalStrategy, string> = {
  direct_explanation: 'Direct explanation',
  socratic_question: 'Socratic question',
  smallest_useful_hint: 'Smallest useful hint',
  worked_example: 'Worked example',
  counterexample: 'Counterexample',
  analogy: 'Analogy',
  visual_representation: 'Visual representation',
  comparison: 'Comparison',
  source_close_reading: 'Source-based close reading',
  classification_task: 'Classification task',
  argument_counterargument: 'Argument and counterargument',
  explain_back: 'Explain-back',
  transfer_task: 'Transfer task',
  delayed_retrieval: 'Delayed retrieval',
  faculty_escalation: 'Faculty escalation',
}
