/**
 * Syrka Learning — visual domain. DeepSeek may request a visual through
 * structured data; it never outputs arbitrary executable SVG, Canvas, or
 * React — Syrka selects and controls the renderer. No generative-image
 * provider is bound in Stage A: Kimi was verified (checkpoint) to have no
 * image-generation endpoint and was rejected as a candidate.
 */

export type VisualPurpose = 'explain' | 'compare' | 'challenge' | 'correct_misconception' | 'show_process' | 'provide_context'

export type VisualRenderer =
  | 'annotated_svg'
  | 'interactive_diagram'
  | 'interactive_simulation'
  | 'chart'
  | 'equation_animation'
  | 'generated_illustration'
  | 'hybrid'

/** The Tutor's request — a brief, never a program. */
export interface LearningVisualRequest {
  id: string
  visualPurpose: VisualPurpose
  renderer: VisualRenderer
  conceptId: string
  learningObjective: string
  misconceptionAddressed?: string
  visualBrief: string
  requiredEntities: string[]
  requiredRelationships: string[]
  prohibitedElements: string[]
  sourceReferenceIds: string[]
  factualConstraints: string[]
  accessibilityDescription: string
}

export type DeterministicVisualKind =
  | 'chemical_equation_balancing'
  | 'atom_counting'
  | 'reactant_product_comparison'
  | 'conservation_of_mass'
  | 'electron_structure'
  | 'ray_diagram'
  | 'circuit_topology'
  | 'ohms_law_graph'
  | 'magnetic_field'
  | 'punnett_square'
  | 'food_web'
  | 'neuron_reflex_arc'
  | 'photosynthesis_process_flow'

/** One entry in the deterministic renderer registry — controlled SVG/Canvas/React, never left to generated imagery, for concepts where exact structure matters. */
export interface DeterministicVisualDefinition {
  id: string
  kind: DeterministicVisualKind
  conceptId: string
  rendererKey: string
  /** Deterministic visuals are always capable of a fully static, reduced-motion-safe render. */
  supportsReducedMotion: true
  accessibilityDescriptionTemplate: string
}

/** What actually gets sent to a generative provider — the minimum required, never the student's complete profile. */
export interface GenerativeVisualRequest {
  id: string
  visualRequestId: string
  concept: string
  misconception?: string
  learningObjective: string
  factualConstraints: string[]
  visualPurpose: VisualPurpose
}

export type VisualClassification = 'deterministic' | 'generated' | 'hybrid'
export type VisualFailureState = 'none' | 'provider_unavailable' | 'validation_failed' | 'unsupported_request'

export interface GeneratedVisualResult {
  id: string
  generativeRequestId: string
  providerName: string
  providerModel: string
  generatedAt: string
  imageUrl?: string
  failureState: VisualFailureState
}

export interface VisualValidationResult {
  requestId: string
  valid: boolean
  reasons: string[]
}

/** The full audit record for one visual shown to a student — deterministic, generated, or hybrid alike. */
export interface LearningVisualRecord {
  id: string
  visualRequestId: string
  rendererUsed: VisualRenderer
  providerName?: string
  providerModel?: string
  generatedAt: string
  sourceReferenceIds: string[]
  validationStatus: 'valid' | 'invalid'
  accessibilityDescription: string
  classification: VisualClassification
  failureState: VisualFailureState
  fallbackUsed: boolean
  studentInteractionSummary?: string
  resultingObservationId?: string
}

/**
 * Provider-neutral contract. No implementation is bound in Stage A —
 * lib/services/learning/visual-router.ts's DeterministicVisualRegistry
 * covers everything the Chapter 1 vertical slice needs without this
 * interface having a real implementation yet.
 */
export interface VisualGenerationProvider {
  generateImage(request: GenerativeVisualRequest): Promise<GeneratedVisualResult>
}
