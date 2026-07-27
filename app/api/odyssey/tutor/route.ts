import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/mock-data/seed'
import { buildOdysseyContext } from '@/lib/services/odyssey/context-builder'
import {
  streamOdysseyTutor,
  buildTutorCitations,
  type OdysseyTutorAction,
  type OdysseyTutorMilestoneContext,
  type OdysseyTutorRequest,
} from '@/lib/services/odyssey/tutor-provider'
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
  'generate_practice_exercise',
  'recommend_next_action',
  'summarize_changes',
  'custom',
  // 'replan_with_constraint' is deliberately absent — replanning must go
  // through the structured /api/odyssey/replan pipeline, never a prose
  // Tutor response treated as the canonical plan.
])

/**
 * Server-only Odyssey AI Tutor route. Streams NDJSON events (`delta` while
 * tokens arrive, then one `done`/`fallback` carrying generation-source
 * provenance and canonical citations) so the client can render text as it
 * arrives instead of waiting for the full response. Advisory only — never
 * verifies Evidence, assigns Capability truth, marks a milestone
 * institutionally complete, or issues a Passport claim; see the system
 * prompt in lib/services/odyssey/tutor-provider.ts for the enforced
 * boundaries.
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

    let versionComparison: OdysseyTutorRequest['versionComparison']
    if (action === 'summarize_changes') {
      const allVersions = await mockOdysseyRepository.listPlanVersions(currentUser.id)
      const sorted = [...allVersions].sort((a, b) => b.version - a.version)
      const [latest, prior] = sorted
      if (latest) {
        versionComparison = {
          current: { version: latest.version, title: latest.title, reasoningSummary: latest.reasoningSummary },
          previous: prior ? { version: prior.version, title: prior.title, reasoningSummary: prior.reasoningSummary } : undefined,
        }
      }
    }

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
            capabilities: target.capabilityIds.map((id) => ({ id, name: capabilityById.get(id)?.name ?? id })),
            blockedReason: target.blockedReason,
            estimatedEffort: target.estimatedEffort,
            alternatives: resolved.alternatives.map((a) => ({ title: a.title, description: a.description, tradeoff: a.tradeoff })),
            requiredEvidence: resolved.evidenceRequirements.map((r) => ({ id: r.id, description: r.description, evidenceRecordIds: r.satisfiedByEvidenceIds })),
          }
        }
      }
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        function write(event: object) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
        }
        try {
          for await (const event of streamOdysseyTutor({ studentContext, milestone: milestoneContext, action, customMessage, versionComparison })) {
            if (event.type === 'delta') {
              write(event)
            } else {
              write({ ...event, citations: milestoneContext ? buildTutorCitations(milestoneContext) : [] })
            }
          }
        } catch {
          write({ type: 'error', text: 'The Tutor could not be reached right now.' })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ status: 'error', message: 'The Tutor could not be reached right now.' }, { status: 500 })
  }
}
