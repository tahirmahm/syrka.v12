import type { SemanticConceptModel, VisualTemplateId } from '@/lib/campus-types/semantic-concept-model'

export interface VisualQualityAssessment {
  passes: boolean
  reasons: string[]
}

const MIN_STAGES_FOR_BARE_SEQUENCE = 3

/**
 * The rejection rule the founder specified directly: a composition that
 * merely reformats prose into one or two large text cards joined by an
 * arrow with no meaningful comparison, relationship, hierarchy or spatial
 * encoding is not a visual — it is prose in boxes. This is what "Horizontal
 * and vertical power-sharing" degenerated into (one Context card, one
 * Outcome card, one downward arrow) before this correction. A composition
 * that fails this gate must be replanned with real structure (more
 * grounded propositions, or actual actor/relationship encoding), never
 * shipped as-is.
 */
export function evaluateVisualInstructionalValue(model: SemanticConceptModel, templateId: VisualTemplateId): VisualQualityAssessment {
  const reasons: string[] = []

  const hasRelationalEncoding = model.actors.length >= 2 && model.relationships.length >= 1
  const hasComparisonEncoding = templateId === 'comparison_columns' && model.stages.some((s) => Boolean(s.comparisonSide))
  const hasEnoughStages = model.stages.length >= MIN_STAGES_FOR_BARE_SEQUENCE

  const isBareCardSequence =
    !hasRelationalEncoding &&
    !hasComparisonEncoding &&
    !hasEnoughStages &&
    (templateId === 'causal_chain' || templateId === 'problem_solution_outcome' || templateId === 'before_after')

  if (isBareCardSequence) {
    reasons.push(
      `The composition reduces to ${model.stages.length} text card${model.stages.length === 1 ? '' : 's'} and an arrow with no comparison, relationship, or spatial encoding — this repeats the lesson prose in boxes rather than visualising the concept.`
    )
  }

  if (model.stages.length === 0) {
    reasons.push('The composition has no stages at all.')
  }

  return { passes: reasons.length === 0, reasons }
}
