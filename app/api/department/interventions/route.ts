import { NextResponse } from 'next/server'
import { mockDepartmentRepository } from '@/lib/repositories'
import { departmentAdministratorUser } from '@/lib/mock-data/seed'
import type { InterventionType } from '@/lib/campus-types'

export const dynamic = 'force-dynamic'

const INTERVENTION_TYPES: InterventionType[] = [
  'revise_assessment',
  'add_evidence_project',
  'increase_review_capacity',
  'require_reviewer_calibration',
  'add_prerequisite_module',
  'modify_course_capability_mapping',
  'support_cohort',
  'commission_curriculum_review',
  'address_provenance_concern',
  'refresh_stale_evidence',
]

/**
 * Creates a departmental intervention as session-only demo state — never a
 * permanent institutional record in this frontend phase, disclosed in the
 * response. Creating an intervention never itself changes any Capability,
 * Evidence, or Passport outcome; expectedEffect is always a projection.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body was not valid JSON.' }, { status: 400 })
  }

  const type = typeof body.type === 'string' && (INTERVENTION_TYPES as string[]).includes(body.type) ? (body.type as InterventionType) : undefined
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const rationale = typeof body.rationale === 'string' ? body.rationale.trim() : ''
  const expectedEffect = typeof body.expectedEffect === 'string' ? body.expectedEffect.trim() : ''
  const evidenceRequiredToEvaluate = typeof body.evidenceRequiredToEvaluate === 'string' ? body.evidenceRequiredToEvaluate.trim() : ''
  const limitations = typeof body.limitations === 'string' ? body.limitations.trim() : ''
  const reviewDate = typeof body.reviewDate === 'string' ? body.reviewDate : ''

  if (!type) return NextResponse.json({ error: 'A valid intervention type is required.' }, { status: 400 })
  if (!title) return NextResponse.json({ error: 'A title is required.' }, { status: 400 })
  if (!rationale) return NextResponse.json({ error: 'A rationale is required.' }, { status: 400 })
  if (!expectedEffect) return NextResponse.json({ error: 'An expected effect (labelled as a projection) is required.' }, { status: 400 })
  if (!reviewDate) return NextResponse.json({ error: 'A review date is required.' }, { status: 400 })

  const capabilityIds = Array.isArray(body.capabilityIds) ? body.capabilityIds.filter((v): v is string => typeof v === 'string') : []
  const programmeId = typeof body.programmeId === 'string' && body.programmeId ? body.programmeId : undefined
  const courseId = typeof body.courseId === 'string' && body.courseId ? body.courseId : undefined
  const cohortId = typeof body.cohortId === 'string' && body.cohortId ? body.cohortId : undefined

  try {
    const departmentId = departmentAdministratorUser.administratorScope!.departmentId!
    const intervention = await mockDepartmentRepository.createIntervention(departmentId, {
      type,
      title,
      rationale,
      programmeId,
      courseId,
      capabilityIds,
      cohortId,
      ownerId: departmentAdministratorUser.id,
      ownerName: departmentAdministratorUser.name,
      expectedEffect,
      evidenceRequiredToEvaluate: evidenceRequiredToEvaluate || 'Not yet specified.',
      limitations: limitations || 'Not yet specified.',
      reviewDate,
    })

    return NextResponse.json({
      intervention,
      persistence: 'session_only',
      message: 'Intervention recorded for this session. This demo does not write to a permanent institutional record, and creating it does not itself change any Capability, Evidence, or Passport outcome.',
    })
  } catch {
    return NextResponse.json({ error: 'The intervention could not be created.' }, { status: 500 })
  }
}
