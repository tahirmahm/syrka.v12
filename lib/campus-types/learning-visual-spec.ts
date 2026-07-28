/**
 * LEARN-002 §6 — the canonical, versioned Learning visual schema. Never
 * stores arbitrary JavaScript, CSS, HTML, or SVG markup — only a
 * structured node/edge/stage graph that a renderer (Mermaid, Desmos, a
 * custom React component, or a structured-text fallback) interprets.
 * DeepSeek may PROPOSE a LearningVisualSpec; only validateVisualSpec()
 * (lib/services/learning/visual-spec-validator.ts) decides whether it is
 * ever shown to a student. See docs/adr/LEARN-002-adaptive-visual-learning-system.md §5.
 */

export type LearningVisualIntent =
  | 'concept_map'
  | 'causal_flow'
  | 'process'
  | 'timeline'
  | 'cycle'
  | 'hierarchy'
  | 'comparison'
  | 'classification'
  | 'argument_map'
  | 'decision_tree'
  | 'system_model'
  | 'mathematical_graph'
  | 'simulation'
  | 'animated_transformation'

export type LearningVisualRenderer = 'mermaid' | 'desmos' | 'custom_react' | 'custom_canvas' | 'excalidraw' | 'three_scene' | 'structured_text' | 'static_accessible_fallback'

export type LearningVisualGeneratedBy = 'deepseek_v4_pro' | 'deepseek_v4_flash' | 'deterministic' | 'faculty_authored'

export interface LearningVisualNode {
  id: string
  label: string
  kind?: string
  groupId?: string
}

export interface LearningVisualEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  label?: string
  kind?: string
}

export interface LearningVisualGroup {
  id: string
  label: string
  nodeIds: string[]
}

export interface LearningVisualStage {
  id: string
  order: number
  label: string
  /** Node/edge ids visible or emphasised at this stage — drives staged reveal, never raw markup. */
  visibleNodeIds: string[]
  visibleEdgeIds: string[]
  narration?: string
}

export interface LearningVisualAnnotation {
  id: string
  targetNodeId?: string
  targetEdgeId?: string
  text: string
}

export interface LearningVisualControls {
  allowPause: boolean
  allowReplay: boolean
  allowStepThrough: boolean
  allowManipulation: boolean
}

export interface LearningVisualInteractionRule {
  id: string
  trigger: 'drag_node' | 'select_node' | 'select_edge' | 'submit_arrangement' | 'advance_stage'
  expectedOutcome: string
}

export interface LearningVisualAssessmentHook {
  id: string
  purpose: 'diagnostic' | 'try' | 'transfer' | 'explain_back'
  prompt: string
  /** Whether this hook requires the visual to be removed before it counts as independent. */
  requiresRemovalForIndependence: boolean
}

export interface LearningVisualSourceReference {
  citation: string
  page?: string
}

export const LEARNING_VISUAL_SPEC_SCHEMA_VERSION = '1.0.0'

export const LEARNING_VISUAL_SPEC_LIMITS = {
  maxNodes: 24,
  maxEdges: 36,
  maxGroups: 8,
  maxStages: 8,
  maxNestingDepth: 2,
  maxLabelLength: 120,
  maxNarrationLength: 400,
  maxExplanationLength: 1200,
  maxAltTextLength: 500,
  maxAnnotations: 16,
  maxSourceReferences: 6,
} as const

export interface LearningVisualSpec {
  id: string
  schemaVersion: typeof LEARNING_VISUAL_SPEC_SCHEMA_VERSION
  tenantId: string
  studentId?: string
  curriculumSource: string
  spaceId: string
  chapterId: string
  conceptId: string
  title: string
  learningObjective: string
  pedagogicalPurpose: string
  visualIntent: LearningVisualIntent
  renderer: LearningVisualRenderer
  orientation: 'horizontal' | 'vertical' | 'radial'
  nodes: LearningVisualNode[]
  edges: LearningVisualEdge[]
  groups: LearningVisualGroup[]
  stages: LearningVisualStage[]
  annotations: LearningVisualAnnotation[]
  controls: LearningVisualControls
  interactionRules: LearningVisualInteractionRule[]
  assessmentHooks: LearningVisualAssessmentHook[]
  misconceptionTargets: string[]
  scaffoldLevel: 'full_support' | 'partial_support' | 'independent'
  explanation: string
  altText: string
  structuredTextEquivalent: string
  sourceReferences: LearningVisualSourceReference[]
  generatedBy: LearningVisualGeneratedBy
  validatedBy: 'schema_validator'
  provenance: {
    generatedAt: string
    generationSource: LearningVisualGeneratedBy
  }
}
