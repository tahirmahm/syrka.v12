/**
 * IAU-001 completion pass — a lightweight, in-process realisation of the
 * envelope shape already defined by CEA-001 (docs/adr/CEA-001-canonical-
 * event-architecture.md §6), not a second event system. This codebase has
 * no literal broker/event-store (frontend-only, no persistence) — this
 * type is the smallest faithful subset of the CEA-001 envelope needed to
 * demonstrate one canonical event family projected through four
 * permission-aware role lenses, per IAU-001 §11.
 */

export interface CanonicalEventEntityRef {
  type: string
  id: string
}

/** Mirrors CEA-001 §5.1's provenance requirement without the broker/schema-registry machinery this demo has no backend for. */
export interface CanonicalEventProvenance {
  sourceEventType: string
  transformer: string
  transformerVersion: string
}

export type CanonicalEventPrivacyClassification = 'public' | 'internal' | 'restricted' | 'highly_restricted'

/**
 * The 17 event types IAU-001 §3 asks the learner-to-institution chain to
 * be expressed through. Names follow CEA-001's PascalCase business-event
 * convention (§2.3) rather than inventing a parallel taxonomy.
 */
export type CanonicalEventType =
  | 'AdaptiveSessionStarted'
  | 'AttemptSubmitted'
  | 'HintRequested'
  | 'TeachingStrategySelected'
  | 'TeachingStrategyChanged'
  | 'TransferCompleted'
  | 'ExplainBackCompleted'
  | 'DelayedRetrievalCompleted'
  | 'LearningObservationCreated'
  | 'EvidenceCandidateCreated'
  | 'EvidenceReviewed'
  | 'CapabilitySupportChanged'
  | 'OdysseyPreparednessChanged'
  | 'PassportClaimEligible'
  | 'CurriculumConditionDetected'
  | 'CurriculumProposalCreated'
  | 'CurriculumProposalReviewed'
  | 'CurriculumVersionProposed'

/**
 * A canonical event as this demo actually stores it: envelope fields per
 * CEA-001 §6.1 (event_id, event_type, occurred_at, tenant_id,
 * source_system, producer, actor/subject/resource, correlation_id,
 * causation_id, privacy, provenance), payload left as a plain record —
 * this codebase has no schema registry to enforce a discriminated union
 * per event type, and inventing one would be more machinery than a
 * 24-event demonstration stream warrants.
 */
export interface CanonicalEvent {
  eventId: string
  eventType: CanonicalEventType
  eventVersion: string
  occurredAt: string
  tenantId: string
  sourceSystem: 'syrka'
  producer: string
  actor: CanonicalEventEntityRef
  subject: CanonicalEventEntityRef
  resource?: CanonicalEventEntityRef
  correlationId: string
  causationId?: string
  privacyClassification: CanonicalEventPrivacyClassification
  provenance: CanonicalEventProvenance
  payload: Record<string, unknown>
  /** True for the small synthetic cohort added purely so Department/University aggregates have more than n=1 to show — never presented as if it were the same real narrative data as the representative student. */
  synthetic?: boolean
}
