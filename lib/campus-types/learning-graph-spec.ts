/**
 * LEARN-002 interactive-graph pass — a bounded schema for a Mafs-rendered
 * quantitative visual, parallel to Learning3DVisualSpec's ownership rule:
 * DeepSeek may only ever produce a validated LearningGraphSpec (numbers,
 * labels, a curriculum-grounded prompt) — never React, JavaScript, SVG, or
 * Mafs source. Syrka-owned components (SyrkaMafsGraph and its Formal vs.
 * informal credit / Development indicators instances) are the only code
 * that ever renders one.
 */

export const LEARNING_GRAPH_SPEC_SCHEMA_VERSION = '1.0.0'

export type GraphGrammar =
  | 'function_relationship'
  | 'parameter_change'
  | 'rate_of_change'
  | 'before_after_curve'
  | 'comparison_series'
  | 'threshold'
  | 'optimisation'
  | 'coordinate_geometry'
  | 'vector_relationship'
  | 'probability_distribution'
  | 'cumulative_change'
  | 'proportional_relationship'
  | 'supply_demand'
  | 'repayment_schedule'
  | 'indicator_comparison'
  | 'spatial_profile'

export interface GraphVariable {
  id: string
  label: string
  unit?: string
  /** Whether the learner can change this variable directly, or it is only ever computed/derived. */
  role: 'learner_controlled' | 'derived'
}

export interface GraphParameter {
  variableId: string
  min: number
  max: number
  step: number
  defaultValue: number
}

export interface GraphFunctionSeries {
  id: string
  label: string
  /** A named curve kind Syrka code evaluates — never an arbitrary expression string. */
  kind: 'simple_interest_repayment' | 'compound_interest_repayment' | 'weighted_indicator_score'
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple'
  /** Which parameter ids (by variableId) feed this series' evaluation. */
  inputVariableIds: string[]
}

export interface GraphPredictionPrompt {
  id: string
  prompt: string
  /** The learner picks/writes a prediction before manipulating the graph — never shown the answer first. */
  requiresPredictionBeforeReveal: boolean
}

export interface GraphAssessmentHook {
  id: string
  purpose: 'predict' | 'explain_divergence' | 'transfer'
  prompt: string
  requiresRemovalForIndependence: boolean
}

export interface LearningGraphSpec {
  graphId: string
  schemaVersion: typeof LEARNING_GRAPH_SPEC_SCHEMA_VERSION
  conceptId: string
  graphGrammar: GraphGrammar
  learningObjective: string
  variables: GraphVariable[]
  parameters: GraphParameter[]
  functions: GraphFunctionSeries[]
  domain: { x: [number, number]; y: [number, number] }
  predictionPrompt: GraphPredictionPrompt
  misconceptionTarget: string
  assessmentHooks: GraphAssessmentHook[]
  /** independent (no graph, matches the founder's "test without graph" requirement) sits alongside guided/full. */
  scaffoldingLevels: ('full' | 'guided' | 'independent')[]
  structuredEquivalent: (state: Record<string, number>) => { label: string; value: string }[]
  sourceReferenceIds: string[]
  provenance: 'faculty_authored_deterministic'
  renderer: 'mafs'
  performanceTier: 'standard' | 'reduced'
}
