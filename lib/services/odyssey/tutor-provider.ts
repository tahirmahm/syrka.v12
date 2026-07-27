import { createDeepSeekClient } from '@/lib/deepseek'
import type { OdysseyContext } from '@/lib/campus-types'
import { ODYSSEY_PROVIDER_CONFIG } from './provider'

export type OdysseyTutorAction =
  | 'explain_milestone'
  | 'teach_concept'
  | 'quiz_me'
  | 'study_plan'
  | 'suggest_project'
  | 'why_blocked'
  | 'compare_alternatives'
  | 'prepare_faculty_questions'
  | 'passport_effect'
  | 'custom'

export interface OdysseyTutorCapabilityRef {
  id: string
  name: string
}

export interface OdysseyTutorEvidenceRef {
  id: string
  description: string
  /** Populated only once real Evidence has been submitted and linked — never fabricated. */
  evidenceRecordIds: string[]
}

export interface OdysseyTutorMilestoneContext {
  title: string
  type: string
  status: string
  description: string
  reasoningSummary: string
  capabilities: OdysseyTutorCapabilityRef[]
  blockedReason?: string
  estimatedEffort?: string
  alternatives: { title: string; description: string; tradeoff: string }[]
  requiredEvidence: OdysseyTutorEvidenceRef[]
}

export interface TutorCitation {
  kind: 'capability' | 'evidence'
  label: string
  /** Omitted when there is no canonical record to link to yet — never a fabricated href. */
  href?: string
}

export interface OdysseyTutorRequest {
  studentContext: OdysseyContext
  milestone?: OdysseyTutorMilestoneContext
  action: OdysseyTutorAction
  customMessage?: string
}

const ACTION_INSTRUCTIONS: Record<OdysseyTutorAction, string> = {
  explain_milestone: 'Explain what this milestone represents and why it appears in this Odyssey, in plain language a student would understand.',
  teach_concept: "Teach the underlying concept behind this milestone's capability area as if the student is encountering it for the first time. Be concrete and use a small example.",
  quiz_me: "Ask 3 short questions to test understanding of this milestone's capability area. Do not reveal the answers.",
  study_plan: 'Propose a short, concrete study plan (a few steps, with rough time estimates) to work toward this milestone.',
  suggest_project: 'Suggest one Evidence-producing project idea the student could propose for this milestone. Note explicitly that any such project would still need institutional review before it counts as Evidence.',
  why_blocked: 'Explain clearly, in the student\'s own terms, why this milestone is currently blocked and exactly what would need to change to unblock it.',
  compare_alternatives: 'Compare the recommended action for this milestone with its listed alternatives, including real trade-offs for each.',
  prepare_faculty_questions: 'Prepare 3 specific, useful questions the student could ask their Faculty reviewer about this milestone.',
  passport_effect: "Explain what completing this milestone — once reviewed — would mean for the student's Syrka Career Passport. Be explicit that this is a projection, not a guarantee.",
  custom: 'Answer the student\'s question below using only the context provided.',
}

const SYSTEM_PROMPT = `You are the Syrka Odyssey AI Tutor — an advisory study companion embedded in a university student's capability-development roadmap.

You may: explain concepts, propose study plans, suggest practice questions, compare routes, help prepare questions for Faculty, and describe projected effects of completing a milestone.

You must never:
- State that any Evidence has been verified.
- Assign or imply a Capability maturity or confidence level as settled fact.
- Say a milestone is institutionally complete or that a Faculty review has happened or what its outcome was.
- Claim a Syrka Career Passport claim has been issued, changed, or strengthened.
- Invent institutional resources, courses, faculty members, or deadlines not present in the supplied context.
- Bypass or minimise the need for Evidence or Faculty review.

Always phrase capability effects as projections ("would", "could"), never guarantees. If asked to do something outside these bounds, briefly explain why not and point to the correct institutional path (e.g. "submit Evidence through the normal flow", "ask your Faculty reviewer"). Keep responses concise and specific to the supplied context — do not pad with generic advice unrelated to the student's actual plan. Respond in plain text, not JSON.`

function buildUserPrompt(request: OdysseyTutorRequest): string {
  const { studentContext, milestone, action, customMessage } = request
  const lines: string[] = []

  lines.push(`Programme: ${studentContext.programmeName}${studentContext.departmentName ? ` (${studentContext.departmentName})` : ''}`)
  lines.push(`Current stage: ${studentContext.currentStage}`)
  lines.push(`Unresolved Evidence reviews: ${studentContext.unresolvedEvidenceReviewCount}`)
  lines.push(
    `Capability snapshot: ${studentContext.capabilities.map((c) => `${c.name} (${c.maturity}, ${c.confidence} confidence)`).join('; ') || 'none on record'}`
  )

  if (milestone) {
    lines.push('')
    lines.push(`Selected milestone: "${milestone.title}" (type: ${milestone.type}, status: ${milestone.status})`)
    lines.push(`Description: ${milestone.description}`)
    lines.push(`Reasoning on record: ${milestone.reasoningSummary}`)
    if (milestone.capabilities.length) lines.push(`Related capabilities: ${milestone.capabilities.map((c) => c.name).join(', ')}`)
    if (milestone.blockedReason) lines.push(`Blocked reason: ${milestone.blockedReason}`)
    if (milestone.estimatedEffort) lines.push(`Estimated effort: ${milestone.estimatedEffort}`)
    if (milestone.requiredEvidence.length) lines.push(`Required Evidence: ${milestone.requiredEvidence.map((r) => r.description).join('; ')}`)
    if (milestone.alternatives.length) {
      lines.push(`Alternatives on record: ${milestone.alternatives.map((a) => `${a.title} (trade-off: ${a.tradeoff})`).join('; ')}`)
    }
  } else {
    lines.push('')
    lines.push('No milestone is currently selected — answer generally about the Odyssey plan above.')
  }

  lines.push('')
  lines.push(`Requested action: ${ACTION_INSTRUCTIONS[action]}`)
  if (action === 'custom' && customMessage) {
    lines.push(`Student's question: ${customMessage}`)
  }

  return lines.join('\n')
}

function fallbackMessage(request: OdysseyTutorRequest): string {
  const title = request.milestone?.title
  if (request.action === 'why_blocked' && request.milestone?.blockedReason) {
    return `DeepSeek isn't available right now, so here's what's on record instead: "${title}" is blocked because ${request.milestone.blockedReason.toLowerCase()}`
  }
  if (title) {
    return `DeepSeek isn't available right now. From what's on record: "${title}" — ${request.milestone?.description ?? 'no further detail is available without the AI Tutor.'} Try again shortly, or review the Overview tab for the full recorded detail.`
  }
  return "DeepSeek isn't available right now, so the Tutor can't respond conversationally. The Overview and Resources tabs still show everything recorded for this Odyssey plan."
}

export type OdysseyTutorStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; generationSource: 'deepseek' }
  | { type: 'fallback'; text: string; generationSource: 'fallback' }

/**
 * Server-only. Streams freeform advisory text token-by-token when DeepSeek
 * is reachable, reusing lib/deepseek.ts the same way the generation/replan
 * providers do. Falls back to one complete message — never a partial,
 * misleading stream — if the API key is absent, the call errors, or the
 * model returns nothing.
 */
export async function* streamOdysseyTutor(request: OdysseyTutorRequest): AsyncGenerator<OdysseyTutorStreamEvent> {
  if (!process.env.DEEPSEEK_API_KEY) {
    yield { type: 'fallback', text: fallbackMessage(request), generationSource: 'fallback' }
    return
  }

  const client = createDeepSeekClient()
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), ODYSSEY_PROVIDER_CONFIG.timeoutMs)

  try {
    const stream = await client.chat.completions.create(
      {
        model: ODYSSEY_PROVIDER_CONFIG.model,
        temperature: 0.4,
        max_tokens: 700,
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(request) },
        ],
      },
      { signal: controller.signal }
    )

    let received = false
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) {
        received = true
        yield { type: 'delta', text: delta }
      }
    }

    if (!received) {
      yield { type: 'fallback', text: fallbackMessage(request), generationSource: 'fallback' }
    } else {
      yield { type: 'done', generationSource: 'deepseek' }
    }
  } catch {
    yield { type: 'fallback', text: fallbackMessage(request), generationSource: 'fallback' }
  } finally {
    clearTimeout(timeoutHandle)
  }
}

/**
 * Citations are computed here, from the canonical milestone record — never
 * from the model's freeform output — so they can never point at a
 * fabricated capability or Evidence record. An Evidence requirement only
 * gets a link once real Evidence has actually been submitted against it.
 */
export function buildTutorCitations(milestone: OdysseyTutorMilestoneContext): TutorCitation[] {
  const citations: TutorCitation[] = []
  milestone.capabilities.forEach((c) => citations.push({ kind: 'capability', label: c.name, href: `/student/capabilities/${c.id}` }))
  milestone.requiredEvidence.forEach((e) => {
    const linkedEvidenceId = e.evidenceRecordIds[0]
    citations.push({ kind: 'evidence', label: e.description, href: linkedEvidenceId ? `/student/evidence/${linkedEvidenceId}` : undefined })
  })
  return citations
}
