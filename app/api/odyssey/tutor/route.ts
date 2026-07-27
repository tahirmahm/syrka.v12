import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/mock-data/seed'
import { buildOdysseyContext } from '@/lib/services/odyssey/context-builder'
import { callOdysseyTutor, type OdysseyTutorAction, type OdysseyTutorMilestoneContext } from '@/lib/services/odyssey/tutor-provider'
import { mockOdysseyRepository, mockCapabilityRepository } from '@/lib/repositories'
import { resolveMilestones } from '@/lib/utilities/odyssey-detail'

export const dynamic = 'force-dynamic'

const VALID_ACTIONS = new Set<OdysseyTutorAction>([
  'explain_milestone',
  'teach_concept',
  'quiz_me',
  'study_plan',
  'suggest_project',
  'why_blocked',
  'compare_alternatives',
  'prepare_faculty_questions',
  'passport_effect',
  'custom',
])

/**
 * Server-only Odyssey AI Tutor route. Advisory only — never verifies
 * Evidence, assigns Capability truth, marks a milestone institutionally
 * complete, or issues a Passport claim; see the system prompt in
 * lib/services/odyssey/tutor-provider.ts for the enforced boundaries.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'error', message: 'Request body was not valid JSON.' }, { status: 400 })
  }

  const action = typeof body.action === 'string' && VALID_ACTIONS.has(body.action as OdysseyTutorAction) ? (body.action as OdysseyTutorAction) : undefined
  if (!action) {
    return NextResponse.json({ status: 'error', message: 'A valid Tutor action is required.' }, { status: 400 })
  }
  const milestoneId = typeof body.milestoneId === 'string' ? body.milestoneId : undefined
  const customMessage = typeof body.message === 'string' ? body.message.slice(0, 2000) : undefined

  try {
    const studentContext = await buildOdysseyContext(currentUser)

    let milestoneContext: OdysseyTutorMilestoneContext | undefined
    if (milestoneId) {
      const planVersion = await mockOdysseyRepository.getCurrentPlanVersion(currentUser.id)
      if (planVersion) {
        const milestones = await mockOdysseyRepository.getMilestonesForVersion(currentUser.id, planVersion.id)
        const target = milestones.find((m) => m.id === milestoneId)
        if (target) {
          const [definitions, evidenceRequirements, alternatives] = await Promise.all([
            mockCapabilityRepository.listDefinitions(),
            mockOdysseyRepository.getEvidenceRequirementsByIds(currentUser.id, target.evidenceRequirementIds),
            mockOdysseyRepository.getAlternativeActionsForMilestones(currentUser.id, [target.id]),
          ])
          const capabilityById = new Map(definitions.map((d) => [d.id, d]))
          const [resolved] = resolveMilestones([target], {
            capabilityById,
            actionById: new Map(),
            evidenceRequirementById: new Map(evidenceRequirements.map((r) => [r.id, r])),
            expectedImpactById: new Map(),
            alternativesByMilestoneId: new Map([[target.id, alternatives]]),
            blockersByMilestoneId: new Map(),
          })
          milestoneContext = {
            title: target.title,
            type: target.type,
            status: target.status,
            description: target.description,
            reasoningSummary: target.reasoningSummary,
            capabilityNames: resolved.capabilityNames,
            blockedReason: target.blockedReason,
            estimatedEffort: target.estimatedEffort,
            alternatives: resolved.alternatives.map((a) => ({ title: a.title, description: a.description, tradeoff: a.tradeoff })),
            requiredEvidence: resolved.evidenceRequirements.map((r) => r.description),
          }
        }
      }
    }

    const result = await callOdysseyTutor({ studentContext, milestone: milestoneContext, action, customMessage })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ status: 'error', message: 'The Tutor could not be reached right now.', generationSource: 'fallback' }, { status: 500 })
  }
}
