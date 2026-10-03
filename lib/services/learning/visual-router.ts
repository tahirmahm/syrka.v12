import type { LearningVisualRequest, DeterministicVisualDefinition, DeterministicVisualKind, VisualValidationResult, VisualClassification, VisualFailureState } from '@/lib/campus-types'

/** The four deterministic visual kinds the Chapter 1 vertical slice needs — architected here, not yet implemented as renderers. */
export const CHAPTER_1_DETERMINISTIC_VISUAL_KINDS: DeterministicVisualKind[] = [
  'chemical_equation_balancing',
  'atom_counting',
  'reactant_product_comparison',
  'conservation_of_mass',
]

export function findDeterministicVisual(registry: DeterministicVisualDefinition[], conceptId: string, kind: DeterministicVisualKind): DeterministicVisualDefinition | undefined {
  return registry.find((v) => v.conceptId === conceptId && v.kind === kind)
}

/** Validates a LearningVisualRequest is well-formed before any renderer is selected. Requests naming the generative/hybrid renderers are well-formed but cannot be fulfilled — see resolveVisualFallback. */
export function validateVisualRequest(request: LearningVisualRequest): VisualValidationResult {
  const reasons: string[] = []
  if (!request.conceptId) reasons.push('conceptId is required.')
  if (!request.learningObjective) reasons.push('learningObjective is required.')
  if (!request.accessibilityDescription) reasons.push('accessibilityDescription is required.')
  return { requestId: request.id, valid: reasons.length === 0, reasons }
}

/**
 * No VisualGenerationProvider is bound in Stage A (Kimi was verified to
 * have no image-generation endpoint and was rejected as a candidate) —
 * a request naming the generative or hybrid renderer always falls back
 * honestly rather than silently failing or fabricating an image.
 */
export function resolveVisualFallback(request: LearningVisualRequest): { classification: VisualClassification; failureState: VisualFailureState } {
  if (request.renderer === 'generated_illustration' || request.renderer === 'hybrid') {
    return { classification: request.renderer === 'hybrid' ? 'hybrid' : 'generated', failureState: 'provider_unavailable' }
  }
  return { classification: 'deterministic', failureState: 'none' }
}
