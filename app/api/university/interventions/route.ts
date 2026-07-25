import { NextResponse } from 'next/server'
import { mockUniversityRepository } from '@/lib/repositories'
import { universityAdministratorUser } from '@/lib/mock-data/seed'
import type { InstitutionalInterventionType } from '@/lib/campus-types'

export const dynamic = 'force-dynamic'

const INTERVENTION_TYPES: InstitutionalInterventionType[] = [
  'institution_wide_calibration',
  'cross_department_curriculum_review',
  'evidence_project_framework',
  'shared_research_opportunity',
  'central_review_capacity_programme',
  'capability_taxonomy_revision',
  'passport_readiness_initiative',
  'odyssey_resource_expansion',
  'evidence_provenance_audit',
  'stale_evidence_refresh_programme',
]

/**
 * Creates an institutional intervention as session-only demo state — never
 * a permanent institutional record in this frontend phase, disclosed in the
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

  const type = typeof body.type === 'string' && (INTERVENTION_TYPES as string[]).includes(body.type) ? (body.type as InstitutionalInterventionType) : undefined
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

  const affectedDepartmentIds = Array.isArray(body.affectedDepartmentIds) ? body.affectedDepartmentIds.filter((v): v is string => typeof v === 'string') : []
  const affectedProgrammeIds = Array.isArray(body.affectedProgrammeIds) ? body.affectedProgrammeIds.filter((v): v is string => typeof v === 'string') : []
  const affectedCapabilityIds = Array.isArray(body.affectedCapabilityIds) ? body.affectedCapabilityIds.filter((v): v is string => typeof v === 'string') : []
  const affectedCohortIds = Array.isArray(body.affectedCohortIds) ? body.affectedCohortIds.filter((v): v is string => typeof v === 'string') : []

  try {
    const intervention = await mockUniversityRepository.createIntervention(universityAdministratorUser.institutionId, {
      type,
      title,
      rationale,
      affectedDepartmentIds,
      affectedProgrammeIds,
      affectedCapabilityIds,
      affectedCohortIds,
      ownerId: universityAdministratorUser.id,
      ownerName: universityAdministratorUser.name,
      expectedEffect,
      evidenceRequiredToEvaluate: evidenceRequiredToEvaluate || 'Not yet specified.',
      limitations: limitations || 'Not yet specified.',
      reviewDate,
    })

    return NextResponse.json({
      intervention,
      persistence: 'session_only',
      message: 'Institutional intervention recorded for this session. This demo does not write to a permanent institutional record, and creating it does not itself change any Capability, Evidence, or Passport outcome.',
    })
  } catch {
    return NextResponse.json({ error: 'The intervention could not be created.' }, { status: 500 })
  }
}
