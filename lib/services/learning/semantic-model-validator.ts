import type { SemanticConceptModel, SemanticStageRole, VisualTemplateId, SyrkaIllustrationId } from '@/lib/campus-types/semantic-concept-model'
import { SEMANTIC_CONCEPT_MODEL_SCHEMA_VERSION } from '@/lib/campus-types/semantic-concept-model'

const VALID_ROLES: SemanticStageRole[] = ['context', 'problem', 'cause', 'mechanism', 'intervention', 'outcome']
const VALID_TEMPLATES: VisualTemplateId[] = [
  'problem_solution_outcome', 'before_after', 'process_sequence', 'causal_chain', 'concept_cards', 'comparison_columns',
  'actor_exchange', 'cycle', 'hierarchy', 'argument_evidence', 'stakeholder_system', 'timeline', 'classification_board',
  'spatial_system', 'data_story',
]
const VALID_ILLUSTRATIONS: SyrkaIllustrationId[] = [
  'farmer', 'shopkeeper', 'buyer', 'coins', 'barter_exchange', 'document', 'institution', 'resource', 'exchange_arrows',
  'environment', 'government', 'evidence', 'claim', 'outcome_check',
]
const INJECTION_PATTERN = /<script|javascript:|on\w+\s*=|<iframe/i
const MIN_STAGES = 2
const MAX_STAGES = 7
const MIN_PROPOSITION_WORDS = 4
const MAX_PROPOSITION_LENGTH = 220

export interface SemanticModelValidationResult {
  valid: boolean
  issues: string[]
}

/**
 * The single authority deciding whether a DeepSeek-proposed
 * SemanticConceptModel is ever shown to a student — mirrors
 * validateVisualSpec()'s role for LearningVisualSpec. Enforces a
 * minimum proposition word count as a structural guard against exactly
 * the keyword-fragment defect this whole system replaced: a "stage"
 * that is a single word can never pass, live model or not.
 */
export function validateSemanticModel(input: unknown): SemanticModelValidationResult {
  const issues: string[] = []
  if (!input || typeof input !== 'object') return { valid: false, issues: ['not an object'] }
  const model = input as Partial<SemanticConceptModel>

  if (typeof model.centralIdea !== 'string' || model.centralIdea.trim().length < 3) issues.push('missing or too-short centralIdea')
  if (!Array.isArray(model.stages) || model.stages.length < MIN_STAGES || model.stages.length > MAX_STAGES) {
    issues.push(`stages must be an array of ${MIN_STAGES}-${MAX_STAGES} entries`)
  } else {
    model.stages.forEach((stage, i) => {
      if (!stage || typeof stage !== 'object') { issues.push(`stage ${i} is not an object`); return }
      if (!VALID_ROLES.includes(stage.role as SemanticStageRole)) issues.push(`stage ${i} has an invalid role`)
      if (typeof stage.proposition !== 'string') {
        issues.push(`stage ${i} missing proposition`)
      } else {
        const wordCount = stage.proposition.trim().split(/\s+/).filter(Boolean).length
        if (wordCount < MIN_PROPOSITION_WORDS) issues.push(`stage ${i} proposition has only ${wordCount} word(s) — must be a full sentence, never a keyword fragment`)
        if (stage.proposition.length > MAX_PROPOSITION_LENGTH) issues.push(`stage ${i} proposition exceeds ${MAX_PROPOSITION_LENGTH} characters`)
        if (INJECTION_PATTERN.test(stage.proposition)) issues.push(`stage ${i} proposition contains disallowed markup`)
      }
      if (stage.illustrationId !== undefined && !VALID_ILLUSTRATIONS.includes(stage.illustrationId as SyrkaIllustrationId)) {
        issues.push(`stage ${i} has an illustrationId outside the allowlist`)
      }
    })
  }

  if (model.actors !== undefined && !Array.isArray(model.actors)) issues.push('actors must be an array')
  if (model.relationships !== undefined && !Array.isArray(model.relationships)) issues.push('relationships must be an array')

  return { valid: issues.length === 0, issues }
}

export function validateRecommendedTemplates(templates: unknown): VisualTemplateId[] {
  if (!Array.isArray(templates)) return []
  return templates.filter((t): t is VisualTemplateId => VALID_TEMPLATES.includes(t as VisualTemplateId)).slice(0, 3)
}

export { SEMANTIC_CONCEPT_MODEL_SCHEMA_VERSION }
