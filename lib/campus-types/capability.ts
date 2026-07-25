import type { ConfidenceScore } from './confidence'

/**
 * Maturity states — verbatim from INF-001 §5 capability maturity table.
 * Progression: Emerging -> Developing -> Proficient -> Advanced -> Expert.
 * Proficient can decay to Stale; Stale can Refresh back to Proficient or be Revoked.
 */
export type CapabilityMaturity =
  | 'Exposed'
  | 'Emerging'
  | 'Developing'
  | 'Proficient'
  | 'Advanced'
  | 'Expert'
  | 'Stale'
  | 'Revoked'

export interface CapabilityDefinition {
  /** Ontology concept id, e.g. "ont:capability:statistical_reasoning" (ONT-001). */
  id: string
  name: string
  domain: string
  description: string
}

export interface CapabilityObservation {
  id: string
  capabilityId: string
  observedAt: string
  /** Ids of evidence items contributing to this observation. */
  evidenceIds: string[]
}

export interface CapabilityState {
  id: string
  capabilityId: string
  subjectId: string
  maturity: CapabilityMaturity
  confidence: ConfidenceScore
  evidenceCount: number
  /** Courses/assessments this state is derived from, for provenance display. */
  courseIds: string[]
  lastObservedAt: string
  history: CapabilityStateHistoryEntry[]
}

export interface CapabilityStateHistoryEntry {
  at: string
  maturity: CapabilityMaturity
  confidence: ConfidenceScore
  /** Short human-readable cause, e.g. "Evidence verified: Research Proposal". */
  cause: string
}

/** Graph edge types — verbatim from GRAPH-001 edge catalogue. */
export type CapabilityEdgeType =
  | 'REQUIRES'
  | 'EVIDENCED_BY'
  | 'ASSERTS'
  | 'INCLUDES'
  | 'SUPERSEDES'
  | 'RELATED_TO'

export interface CapabilityEdge {
  id: string
  type: CapabilityEdgeType
  fromCapabilityId: string
  toCapabilityId: string
  /** Evidence strength driving edge weight in the graph view (DESIGN-001 §10). */
  weight: number
}
