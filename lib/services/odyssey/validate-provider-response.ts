import type { OdysseyRawProviderResponse, OdysseyRawMilestone, OdysseyValidationIssue, OdysseyValidationResult } from '@/lib/campus-types'

const MILESTONE_TYPES = new Set([
  'goal', 'capability_target', 'capability_gap', 'course', 'module', 'project', 'assessment',
  'research_opportunity', 'internship', 'competition', 'credential', 'career_milestone', 'human_review',
])

// 'completed' and 'verified' are deliberately excluded — those states may only be
// assigned locally, in response to real Evidence review, never asserted by the AI.
const ALLOWED_RAW_STATUSES = new Set([
  'recommended', 'accepted', 'planned', 'in_progress', 'evidence_pending', 'under_review',
  'deferred', 'blocked', 'superseded', 'no_longer_relevant',
])

const CONFIDENCE_BANDS = new Set(['Unsupported', 'Emerging', 'Supported', 'Strong'])
const MATURITIES = new Set(['Exposed', 'Emerging', 'Developing', 'Proficient', 'Advanced', 'Expert', 'Stale', 'Revoked'])
const ACTION_TYPES = new Set([
  'course', 'module', 'project', 'research', 'assessment', 'competition', 'internship',
  'simulation', 'presentation', 'collaboration', 'laboratory', 'faculty_review',
])

export interface ValidationReferenceSets {
  capabilityIds: Set<string>
  evidenceIds: Set<string>
  resourceIds: Set<string>
  /** Milestone ids that already exist and may be referenced as prerequisites without being redefined (replanning only). */
  existingMilestoneIds: Set<string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validates a raw, untrusted DeepSeek response against structural rules and
 * the student's real reference sets. Nothing here is rendered — this only
 * decides whether generation-service.ts may proceed to map the response into
 * canonical Odyssey domain objects, or must fall back.
 */
export function validateProviderResponse(raw: unknown, refs: ValidationReferenceSets): OdysseyValidationResult {
  const issues: OdysseyValidationIssue[] = []
  const push = (code: string, message: string, milestoneId?: string) => issues.push({ code, message, milestoneId })

  if (!isRecord(raw)) {
    return { valid: false, issues: [{ code: 'malformed_json', message: 'Provider response was not a JSON object.' }] }
  }

  const r = raw as Partial<OdysseyRawProviderResponse>

  if (!isNonEmptyString(r.planTitle)) push('missing_field', 'Missing planTitle.')
  if (!isNonEmptyString(r.destinationTitle)) push('missing_field', 'Missing destinationTitle.')
  if (!isNonEmptyString(r.planSummary)) push('missing_field', 'Missing planSummary.')
  if (!isNonEmptyString(r.reasoningSummary)) push('missing_field', 'Missing reasoningSummary.')
  if (!isNonEmptyString(r.planVersionReason)) push('missing_field', 'Missing planVersionReason.')
  if (!isNonEmptyString(r.recommendationConfidence) || !CONFIDENCE_BANDS.has(r.recommendationConfidence)) {
    if (r.recommendationConfidence === 'Verified') push('ai_claimed_verified_confidence', 'Provider claimed Verified confidence for a recommendation — only real Evidence review may reach Verified.')
    else push('invalid_confidence_band', `Unsupported recommendationConfidence "${String(r.recommendationConfidence)}".`)
  }
  if (!Array.isArray(r.milestones) || r.milestones.length === 0) {
    push('missing_field', 'Missing or empty milestones array.')
    return { valid: false, issues }
  }

  const seenMilestoneIds = new Set<string>()
  const newMilestoneIds = new Set<string>()
  for (const raw of r.milestones) {
    if (!isRecord(raw)) {
      push('malformed_milestone', 'A milestone entry was not an object.')
      continue
    }
    const m = raw as Partial<OdysseyRawMilestone>
    if (!isNonEmptyString(m.id)) {
      push('missing_field', 'Milestone missing id.')
      continue
    }
    if (seenMilestoneIds.has(m.id)) push('duplicate_milestone_id', `Duplicate milestone id "${m.id}".`, m.id)
    seenMilestoneIds.add(m.id)
    newMilestoneIds.add(m.id)

    if (!isNonEmptyString(m.title)) push('missing_field', `Milestone "${m.id}" missing title.`, m.id)
    if (!isNonEmptyString(m.description)) push('missing_field', `Milestone "${m.id}" missing description.`, m.id)
    if (!isNonEmptyString(m.reasoningSummary)) push('missing_field', `Milestone "${m.id}" missing reasoningSummary.`, m.id)
    if (!isNonEmptyString(m.completionImpact)) push('missing_field', `Milestone "${m.id}" missing completionImpact.`, m.id)
    if (!isNonEmptyString(m.type) || !MILESTONE_TYPES.has(m.type)) push('unsupported_milestone_type', `Milestone "${m.id}" has unsupported type "${String(m.type)}".`, m.id)

    if (!isNonEmptyString(m.status) || !ALLOWED_RAW_STATUSES.has(m.status)) {
      if (m.status === 'completed' || m.status === 'verified') {
        push('ai_claimed_verified_completion', `Milestone "${m.id}" claims status "${m.status}" — completion/verification may only be assigned once real Evidence is reviewed.`, m.id)
      } else {
        push('unsupported_status', `Milestone "${m.id}" has unsupported status "${String(m.status)}".`, m.id)
      }
    }
    if (!isNonEmptyString(m.recommendationConfidence) || !CONFIDENCE_BANDS.has(m.recommendationConfidence)) {
      if (m.recommendationConfidence === 'Verified') push('ai_claimed_verified_confidence', `Milestone "${m.id}" claims Verified confidence.`, m.id)
      else push('invalid_confidence_band', `Milestone "${m.id}" has unsupported recommendationConfidence.`, m.id)
    }
    if (m.targetMaturity && !MATURITIES.has(m.targetMaturity)) push('invalid_maturity_state', `Milestone "${m.id}" has unsupported targetMaturity "${m.targetMaturity}".`, m.id)
    if (m.targetConfidence && m.targetConfidence !== 'Verified' && !CONFIDENCE_BANDS.has(m.targetConfidence)) {
      push('invalid_confidence_band', `Milestone "${m.id}" has unsupported targetConfidence.`, m.id)
    }

    if (m.status === 'blocked' && !isNonEmptyString(m.blockedReason)) push('impossible_state', `Milestone "${m.id}" is blocked but has no blockedReason.`, m.id)
    if (m.status !== 'blocked' && isNonEmptyString(m.blockedReason)) push('impossible_state', `Milestone "${m.id}" has a blockedReason but is not blocked.`, m.id)

    ;(m.capabilityIds ?? []).forEach((id) => {
      if (!refs.capabilityIds.has(id)) push('unknown_capability_id', `Milestone "${m.id}" references unknown capability "${id}".`, m.id)
    })
    ;(m.prerequisiteMilestoneIds ?? []).forEach((id) => {
      if (id === m.id) push('self_referential_prerequisite', `Milestone "${m.id}" lists itself as a prerequisite.`, m.id)
    })
    ;(m.actions ?? []).forEach((action) => {
      if (!isRecord(action)) return
      if (action.resourceId && !refs.resourceIds.has(action.resourceId)) {
        push('unknown_resource_id', `Milestone "${m.id}" action references unknown institutional resource "${action.resourceId}".`, m.id)
      }
      if (!isNonEmptyString(action.type) || !ACTION_TYPES.has(action.type)) {
        push('unsupported_action_type', `Milestone "${m.id}" has an action with unsupported type "${String(action.type)}".`, m.id)
      }
      ;(action.developsCapabilityIds ?? []).forEach((id: string) => {
        if (!refs.capabilityIds.has(id)) push('unknown_capability_id', `Milestone "${m.id}" action references unknown capability "${id}".`, m.id)
      })
    })
    ;(m.expectedImpacts ?? []).forEach((impact) => {
      if (!isRecord(impact)) return
      if (!refs.capabilityIds.has(impact.capabilityId as string)) {
        push('unknown_capability_id', `Milestone "${m.id}" expected impact references unknown capability "${impact.capabilityId}".`, m.id)
      }
      if (impact.projectedConfidence === 'Verified') {
        push('ai_claimed_verified_confidence', `Milestone "${m.id}" projects Verified confidence — expected impact is a projection, not verified truth.`, m.id)
      }
    })
  }

  // Prerequisites must resolve to either a milestone in this response or a pre-existing one supplied in context.
  for (const raw of r.milestones) {
    if (!isRecord(raw)) continue
    const m = raw as Partial<OdysseyRawMilestone>
    if (!isNonEmptyString(m.id)) continue
    ;(m.prerequisiteMilestoneIds ?? []).forEach((id) => {
      if (id !== m.id && !newMilestoneIds.has(id) && !refs.existingMilestoneIds.has(id)) {
        push('unknown_milestone_reference', `Milestone "${m.id}" references unknown prerequisite milestone "${id}".`, m.id)
      }
    })
  }

  // Circular prerequisite detection across the returned milestone set.
  const byId = new Map(r.milestones.filter(isRecord).map((m) => [m.id as string, m as Partial<OdysseyRawMilestone>]))
  const visitState = new Map<string, 'visiting' | 'done'>()
  const reported = new Set<string>()
  const detectCycle = (id: string) => {
    const state = visitState.get(id)
    if (state === 'done') return
    if (state === 'visiting') {
      if (!reported.has(id)) {
        reported.add(id)
        push('circular_prerequisite', `Circular prerequisite chain detected involving milestone "${id}".`, id)
      }
      return
    }
    visitState.set(id, 'visiting')
    byId.get(id)?.prerequisiteMilestoneIds?.forEach((prereqId) => {
      if (byId.has(prereqId)) detectCycle(prereqId)
    })
    visitState.set(id, 'done')
  }
  Array.from(byId.keys()).forEach(detectCycle)

  ;(r.blockers ?? []).forEach((blocker) => {
    if (!isRecord(blocker)) return
    const milestoneId = blocker.milestoneId as string
    if (!newMilestoneIds.has(milestoneId) && !refs.existingMilestoneIds.has(milestoneId)) {
      push('unknown_milestone_reference', `Blocker references unknown milestone "${milestoneId}".`)
    }
  })

  return { valid: issues.length === 0, issues }
}
