import type { OdysseyGenerationRequest, OdysseyReplanningRequest, OdysseyContext } from '@/lib/campus-types'

/**
 * Prompt construction is kept separate from context construction
 * (context-builder.ts) so the underlying student data can be reviewed
 * independently of how it gets phrased for the model.
 */
const RESPONSE_SCHEMA_INSTRUCTIONS = `Respond with a single JSON object only — no markdown fences, no commentary — matching exactly this shape:
{
  "planTitle": string,
  "destinationTitle": string,
  "destinationDescription": string (optional),
  "planSummary": string,
  "reasoningSummary": string,
  "recommendationConfidence": "Unsupported" | "Emerging" | "Supported" | "Strong",
  "planVersionReason": string,
  "milestones": [{
    "id": string (short, kebab-case, unique within this response),
    "type": "goal" | "capability_target" | "capability_gap" | "course" | "module" | "project" | "assessment" | "research_opportunity" | "internship" | "competition" | "credential" | "career_milestone" | "human_review",
    "title": string,
    "description": string,
    "capabilityIds": string[] (only ids from the supplied capability list),
    "prerequisiteMilestoneIds": string[] (ids from this response or from "existing milestone ids" if replanning),
    "targetMaturity": "Exposed"|"Emerging"|"Developing"|"Proficient"|"Advanced"|"Expert" (optional),
    "targetConfidence": "Unsupported"|"Emerging"|"Supported"|"Strong" (optional),
    "actions": [{ "type": "course"|"module"|"project"|"research"|"assessment"|"competition"|"internship"|"simulation"|"presentation"|"collaboration"|"laboratory"|"faculty_review", "title": string, "description": string, "developsCapabilityIds": string[], "requiresReview": boolean, "resourceId": string (optional, only from the supplied resource list — omit entirely for a genuinely new proposed action) }],
    "evidenceRequirements": [{ "description": string, "sourceTypeHint": string (optional) }],
    "expectedImpacts": [{ "capabilityId": string, "projectedMaturity": string, "projectedConfidence": string }],
    "estimatedEffort": string (optional),
    "reasoningSummary": string,
    "status": "recommended" | "accepted" | "planned" | "in_progress" | "evidence_pending" | "under_review" | "deferred" | "blocked" | "superseded" | "no_longer_relevant",
    "recommendationConfidence": "Unsupported"|"Emerging"|"Supported"|"Strong",
    "blockedReason": string (required only if status is "blocked"),
    "completionImpact": string
  }],
  "constraints": [{ "type": "workload"|"time"|"financial"|"geography"|"accessibility"|"preference"|"institutional", "description": string }] (optional),
  "blockers": [{ "milestoneId": string, "reason": string, "unblockedBy": string (optional) }] (optional),
  "changeSummary": string (required when replanning, describing what changed and why)
}
Hard rules: never invent a Capability id, Evidence id, or institutional resource id — use only the ids supplied in the context below. Never set status to "completed" or "verified" — those states may only be assigned once real Evidence has been reviewed by the institution. Never use the confidence band "Verified" anywhere — that band means institutionally verified truth, not a recommendation. If you propose a genuinely new action with no matching resource, omit resourceId entirely rather than guessing one.`

function describeContext(context: OdysseyContext): string {
  return JSON.stringify(
    {
      programmeName: context.programmeName,
      departmentName: context.departmentName,
      currentStage: context.currentStage,
      completedModuleTitles: context.completedModuleTitles,
      currentModuleTitles: context.currentModuleTitles,
      intentSummary: context.intentSummary,
      capabilities: context.capabilities,
      unresolvedEvidenceReviewCount: context.unresolvedEvidenceReviewCount,
      availableResources: context.availableResources.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        description: r.description,
        relatedCapabilityIds: r.relatedCapabilityIds,
        workloadEstimate: r.workloadEstimate,
      })),
      constraints: context.constraints,
      passportReadiness: context.passportReadiness,
      currentPlan: context.currentPlan,
    },
    null,
    2
  )
}

export function buildGenerationPrompt(request: OdysseyGenerationRequest): { system: string; user: string } {
  const system = `You are Syrka Odyssey's planning assistant for one student inside a specific academic institution. You recommend an evidence-backed progression roadmap toward a destination the student chose. You never verify Evidence, never assign Verified confidence, never claim coursework is complete, and never invent institutional resources or capability ids. ${RESPONSE_SCHEMA_INSTRUCTIONS}`
  const user = `Student context:\n${describeContext(request.context)}\n\nRequested destination: ${request.destinationTitle}${request.destinationDescription ? ` — ${request.destinationDescription}` : ''}\nWorkload preference: ${request.workloadPreference ?? 'standard'}\nTime horizon: ${request.timeHorizon ?? 'not specified'}\nPreferred action types: ${(request.preferredActionTypes ?? []).join(', ') || 'none specified'}\n\nGenerate an initial Odyssey plan toward this destination, referencing only the capability ids and resource ids present in the context above.`
  return { system, user }
}

export function buildReplanningPrompt(request: OdysseyReplanningRequest): { system: string; user: string } {
  const existingIds = request.currentMilestones.map((m) => m.id).join(', ')
  const system = `You are Syrka Odyssey's replanning assistant for one student. You revise an existing plan in response to a plain-language adjustment request, without silently discarding milestones that are still relevant. ${RESPONSE_SCHEMA_INSTRUCTIONS}\nWhen a milestone from the current plan is still valid, reuse its exact id. Existing milestone ids you may reference (including as prerequisites) without redefining: ${existingIds || 'none'}.`
  const user = `Student context:\n${describeContext(request.context)}\n\nCurrent plan: "${request.currentPlanVersion.title}" (version ${request.currentPlanVersion.version})\nCurrent milestones:\n${request.currentMilestones.map((m) => `- [${m.id}] ${m.title} (${m.status})`).join('\n')}\n\nStudent's adjustment request: "${request.adjustmentInstruction}"\n\nProduce a revised plan reflecting this request. Populate changeSummary with a concise, honest explanation of what changed and why.`
  return { system, user }
}
