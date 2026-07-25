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

/** Ontology-level capability definition (ONT-001), independent of any subject. */
export interface CapabilityDefinition {
  /** Ontology concept id, e.g. "ont:capability:statistical_reasoning" (ONT-001). */
  id: string
  name: string
  domain: string
  description: string
}

/**
 * A point-in-time confidence assessment for a subject's capability claim
 * (GRAPH-001 HAS_CONFIDENCE: "one active, many historical"). Kept separate
 * from CapabilityClaim so assessment history isn't collapsed into the
 * current-state object.
 */
export interface ConfidenceAssessment {
  at: string
  maturity: CapabilityMaturity
  confidence: ConfidenceScore
  /** Short human-readable cause, e.g. "Evidence verified: Research Proposal". */
  cause: string
}

/**
 * The accepted claim that a subject has a capability, at a maturity and
 * confidence, with provenance (INF-001 "Capability Assertion"; GRAPH-001
 * CapabilityObservation). Product-facing term: capability claim.
 */
export interface CapabilityClaim {
  id: string
  capabilityId: string
  subjectId: string
  maturity: CapabilityMaturity
  confidence: ConfidenceScore
  evidenceCount: number
  /** Ids of evidence records currently supporting this claim. */
  evidenceIds: string[]
  /** Courses/assessments this claim is derived from, for provenance display. */
  courseIds: string[]
  lastObservedAt: string
  history: ConfidenceAssessment[]
}

/**
 * Capability-to-capability graph relationships only — evidence's relation
 * to a capability is carried by CapabilityClaim.evidenceIds and rendered
 * as a node property (evidence count), not as a graph edge, per
 * DESIGN-001 §10 ("edge thickness for evidence strength" refers to the
 * strength of the capability-to-capability relationship itself).
 *
 * Edge types are exactly GRAPH-001 §4.2:
 * - REQUIRES: a genuine prerequisite relationship.
 * - DEPENDS_ON: a general, non-prerequisite association between capabilities.
 */
export type CapabilityRelationType = 'REQUIRES' | 'DEPENDS_ON'

export interface CapabilityRelationEdge {
  id: string
  type: CapabilityRelationType
  fromCapabilityId: string
  toCapabilityId: string
  /** Relationship confidence (GRAPH-001 "mapping confidence"), drives edge weight/thickness. */
  confidence: ConfidenceScore
}
