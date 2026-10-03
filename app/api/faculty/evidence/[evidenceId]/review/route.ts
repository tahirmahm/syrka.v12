import { NextResponse } from 'next/server'
import { mockFacultyRepository } from '@/lib/repositories'
import { facultyUser } from '@/lib/mock-data/seed'
import type { ReviewDecisionType, EvidenceLimitationTag, ProvenanceConcernType } from '@/lib/campus-types'

export const dynamic = 'force-dynamic'

const DECISION_TYPES: ReviewDecisionType[] = ['approve', 'request_revision', 'request_clarification', 'dispute_attribution', 'revoke', 'confirm_supersession']
const LIMITATION_TAGS: EvidenceLimitationTag[] = ['single_context', 'stale_context', 'insufficient_detail', 'unclear_attribution', 'partial_capability_coverage']
const PROVENANCE_CONCERNS: ProvenanceConcernType[] = ['unclear_authorship', 'unverifiable_source', 'possible_duplication', 'external_credential_unverified']

/**
 * Records a Faculty review decision as session-only demo state (never a
 * permanent institutional record in this frontend phase — disclosed to the
 * client in the response, never described as "saved" without qualification).
 */
export async function POST(request: Request, { params }: { params: { evidenceId: string } }) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body was not valid JSON.' }, { status: 400 })
  }

  const decisionType = typeof body.decisionType === 'string' && (DECISION_TYPES as string[]).includes(body.decisionType) ? (body.decisionType as ReviewDecisionType) : undefined
  const rationale = typeof body.rationale === 'string' ? body.rationale.trim() : ''

  if (!decisionType) return NextResponse.json({ error: 'A valid decision type is required.' }, { status: 400 })
  if (!rationale) return NextResponse.json({ error: 'A rationale is required to record a review decision.' }, { status: 400 })

  const limitations = Array.isArray(body.limitations) ? body.limitations.filter((l): l is EvidenceLimitationTag => (LIMITATION_TAGS as string[]).includes(l)) : []
  const supportedCapabilityIds = Array.isArray(body.supportedCapabilityIds) ? body.supportedCapabilityIds.filter((v): v is string => typeof v === 'string') : []
  const unsupportedCapabilityIds = Array.isArray(body.unsupportedCapabilityIds) ? body.unsupportedCapabilityIds.filter((v): v is string => typeof v === 'string') : []
  const provenanceConcern =
    typeof body.provenanceConcern === 'string' && (PROVENANCE_CONCERNS as string[]).includes(body.provenanceConcern) ? (body.provenanceConcern as ProvenanceConcernType) : undefined

  try {
    const { decision, updatedStatus } = await mockFacultyRepository.commitReviewDecision(facultyUser.id, {
      evidenceId: params.evidenceId,
      decisionType,
      rationale,
      limitations,
      supportedCapabilityIds,
      unsupportedCapabilityIds,
      provenanceConcern,
    })

    return NextResponse.json({
      decision,
      updatedStatus,
      persistence: 'session_only',
      message: 'Review decision recorded for this session. This demo does not write to a permanent institutional record.',
    })
  } catch {
    return NextResponse.json({ error: 'The review decision could not be recorded.' }, { status: 500 })
  }
}
