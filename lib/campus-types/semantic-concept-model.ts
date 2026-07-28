/**
 * LEARN-002 visual-quality correction — replaces token-fragment "extract
 * keyTerms, put the first in the centre, connect the rest with 'relates
 * to'" with a real semantic model: a chain of grounded propositions, not
 * isolated words. A SemanticConceptModel is still just data (never
 * executable script/SVG/HTML) — SyrkaVisualComposer is the only thing
 * that turns it into a rendered visual, exactly like LearningVisualSpec
 * governs Mermaid.
 */

export const SEMANTIC_CONCEPT_MODEL_SCHEMA_VERSION = '1.0.0'

export type SemanticStageRole = 'problem' | 'cause' | 'mechanism' | 'intervention' | 'outcome' | 'context'

export interface SemanticStage {
  id: string
  order: number
  role: SemanticStageRole
  /** A full grounded proposition ("Barter requires both parties to want what the other offers"), never a bare keyword. */
  proposition: string
  /** An allowlisted illustration id — never a remote URL or generated SVG. Undefined renders a plain labelled card. */
  illustrationId?: SyrkaIllustrationId
  /** Set only when this stage belongs to one side of a two-sided comparison (see comparisonLabels on the model) — never inferred from a single keyword, only from a real structural comparison. */
  comparisonSide?: 'a' | 'b'
}

export interface SemanticActor {
  id: string
  label: string
  illustrationId?: SyrkaIllustrationId
}

export type SemanticRelationshipKind = 'gives_to' | 'receives_from' | 'enables' | 'blocks' | 'causes' | 'compares_to'

export interface SemanticRelationship {
  id: string
  fromActorId: string
  toActorId: string
  kind: SemanticRelationshipKind
  label: string
}

export type VisualTemplateId =
  | 'problem_solution_outcome'
  | 'before_after'
  | 'process_sequence'
  | 'causal_chain'
  | 'concept_cards'
  | 'comparison_columns'
  | 'actor_exchange'
  | 'cycle'
  | 'hierarchy'
  | 'argument_evidence'
  | 'stakeholder_system'
  | 'timeline'
  | 'classification_board'
  | 'spatial_system'
  | 'data_story'

/** Allowlisted illustration identifiers — Syrka code maps these to trusted local components; DeepSeek may select one but can never emit new SVG or a remote URL. */
export type SyrkaIllustrationId =
  | 'farmer'
  | 'shopkeeper'
  | 'buyer'
  | 'coins'
  | 'barter_exchange'
  | 'document'
  | 'institution'
  | 'resource'
  | 'exchange_arrows'
  | 'environment'
  | 'government'
  | 'evidence'
  | 'claim'
  | 'outcome_check'

export interface SemanticConceptModel {
  schemaVersion: typeof SEMANTIC_CONCEPT_MODEL_SCHEMA_VERSION
  conceptId: string
  centralIdea: string
  learningObjective: string
  stages: SemanticStage[]
  actors: SemanticActor[]
  relationships: SemanticRelationship[]
  misconception?: string
  generatedBy: 'deterministic' | 'deepseek_v4_pro'
  /** The two sides' real labels ("Horizontal", "Vertical") — present only when stages carry comparisonSide, for the comparison_columns template. */
  comparisonLabels?: { a: string; b: string }
}

export interface VisualCompositionCandidate {
  templateId: VisualTemplateId
  label: string
  reason: string
  recommended: boolean
}

export interface VisualNarrative {
  model: SemanticConceptModel
  candidates: VisualCompositionCandidate[]
  structuredTextEquivalent: string
  altText: string
}
