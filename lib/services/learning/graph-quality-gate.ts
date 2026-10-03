import type { LearningGraphSpec } from '@/lib/campus-types/learning-graph-spec'

export interface GraphQualityAssessment {
  passes: boolean
  reasons: string[]
}

/**
 * LEARN-002 interactive-graph pass — mirrors visual-quality-gate.ts's
 * rejection rule for the graph renderer: a concept must not be routed to
 * Mafs just because it contains numbers, and a graph that is only a
 * decorative static curve with no learner-controlled variable, no
 * prediction, and no transfer assessment is not an interactive — it is a
 * picture of a formula. This gate never runs per-interaction (no
 * per-slider-move check); it validates the authored LearningGraphSpec
 * once, before a concept route is allowed to ship on the Mafs renderer.
 */
export function evaluateGraphInstructionalValue(spec: LearningGraphSpec): GraphQualityAssessment {
  const reasons: string[] = []

  const hasLearnerControlledVariable = spec.variables.some((v) => v.role === 'learner_controlled') && spec.parameters.length > 0
  if (!hasLearnerControlledVariable) {
    reasons.push('No learner-controlled variable exists — the graph would just be a static picture of a formula.')
  }

  if (!spec.predictionPrompt.requiresPredictionBeforeReveal) {
    reasons.push('The graph does not require a prediction before the curve is revealed.')
  }

  if (spec.assessmentHooks.every((h) => h.purpose !== 'transfer')) {
    reasons.push('No transfer assessment exists.')
  }

  if (!spec.scaffoldingLevels.includes('independent')) {
    reasons.push('There is no independent (graph-removed) scaffolding level to test unaided transfer.')
  }

  if (spec.functions.length === 0) {
    reasons.push('No function series are defined — there is nothing to plot.')
  }

  if (!spec.misconceptionTarget.trim()) {
    reasons.push('No misconception target is named — the graph is not aimed at a specific curriculum-grounded confusion.')
  }

  return { passes: reasons.length === 0, reasons }
}
