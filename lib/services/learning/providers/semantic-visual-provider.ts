import { callLearningDeepSeek, LEARNING_PROVIDER_CONFIG } from './deepseek-call'
import { buildVisualNarrative } from '@/lib/services/learning/semantic-model-builder'
import { validateSemanticModel, validateRecommendedTemplates, SEMANTIC_CONCEPT_MODEL_SCHEMA_VERSION } from '@/lib/services/learning/semantic-model-validator'
import { evaluateVisualInstructionalValue } from '@/lib/services/learning/visual-quality-gate'
import type { NcertConceptWorkbenchView } from '@/lib/utilities/ncert-curriculum-projection'
import type { SemanticConceptModel, VisualNarrative, VisualCompositionCandidate, VisualTemplateId } from '@/lib/campus-types/semantic-concept-model'
import type { LearningGenerationSource } from './types'

export type SemanticVisualResultCategory = 'deepseek_live' | 'deepseek_cached' | 'deterministic_unavailable' | 'deterministic_not_configured'

export interface SemanticVisualTrace {
  requestId: string
  keyConfigured: boolean
  liveRequestAttempted: boolean
  /** null when no live call was attempted this request (not configured, or served from cache). */
  authenticationSucceeded: boolean | null
  requestedModel: string
  resultCategory: SemanticVisualResultCategory
}

export interface SemanticVisualResult {
  generationSource: LearningGenerationSource
  narrative: VisualNarrative
  trace: SemanticVisualTrace
}

/**
 * Per-warm-instance cache only — a plain module-scope Map, not a shared
 * KV store. A cold start (new Lambda instance) starts empty again; this
 * is disclosed honestly rather than claimed as durable cross-instance
 * caching, which would need Vercel KV/Redis this pass does not add.
 */
const semanticVisualCache = new Map<string, SemanticConceptModel>()

const CANDIDATE_LABEL: Record<string, string> = {
  before_after: 'Before and after',
  problem_solution_outcome: 'Problem, intervention, outcome',
  causal_chain: 'Causal sequence',
  actor_exchange: 'Actor exchange',
  comparison_columns: 'Side-by-side comparison',
  classification_board: 'Classification board',
}

/**
 * comparison_columns can only render correctly when stages carry a real
 * comparisonSide tag — DeepSeek's JSON schema never emits that field (it
 * emits only role/proposition/illustrationId), so honouring a DeepSeek
 * "comparison_columns" recommendation without that structure would silently
 * render empty columns. Any such recommendation is downgraded to
 * causal_chain here rather than trusted at face value.
 */
function sanitiseRecommendedTemplates(templates: string[], model: SemanticConceptModel): string[] {
  const hasComparisonStructure = model.stages.some((s) => Boolean(s.comparisonSide))
  const sanitised = templates.filter((t) => t !== 'comparison_columns' || hasComparisonStructure)
  return sanitised.length ? sanitised : ['causal_chain']
}

function buildNarrativeFromModel(model: SemanticConceptModel, recommendedTemplates: string[], view: NcertConceptWorkbenchView): VisualNarrative {
  const templates = sanitiseRecommendedTemplates(recommendedTemplates, model)
  const candidates: VisualCompositionCandidate[] = templates.map((templateId, i) => ({
    templateId: templateId as VisualCompositionCandidate['templateId'],
    label: CANDIDATE_LABEL[templateId] ?? templateId,
    reason: i === 0
      ? `DeepSeek recommended this as the clearest composition for "${view.title}".`
      : `An alternative composition of the same underlying model.`,
    recommended: i === 0,
  }))
  const structuredTextEquivalent = model.stages.map((s, i) => `${i + 1}. ${s.proposition}`).join(' ')
  return {
    model,
    candidates,
    structuredTextEquivalent,
    altText: `A visual explanation of "${model.centralIdea}" showing ${model.stages.length} connected ideas from context to outcome.`,
  }
}

/**
 * The real DeepSeek V4-Pro path for the default syrka_visual renderer.
 * Never asked to emit React, SVG, JavaScript, HTML, or CSS — only the
 * structured SemanticConceptModel JSON shape, schema-validated by
 * validateSemanticModel() before it can reach SyrkaVisualComposer. Falls
 * back to the deterministic semantic-model-builder path (hand-authored
 * for "Functions of money", sentence-derived for every other concept) on
 * any configuration absence, provider failure, or validation failure —
 * never partially trusting an invalid response.
 */
export async function proposeSemanticVisual(view: NcertConceptWorkbenchView): Promise<SemanticVisualResult> {
  const requestId = `sv-${crypto.randomUUID()}`
  const keyConfigured = Boolean(process.env.DEEPSEEK_API_KEY)
  const requestedModel = LEARNING_PROVIDER_CONFIG.pro.model
  const cacheKey = `${view.conceptId}:${SEMANTIC_CONCEPT_MODEL_SCHEMA_VERSION}`

  if (!keyConfigured) {
    return {
      generationSource: 'deterministic_fallback',
      narrative: buildVisualNarrative(view),
      trace: { requestId, keyConfigured, liveRequestAttempted: false, authenticationSucceeded: null, requestedModel, resultCategory: 'deterministic_not_configured' },
    }
  }

  const cached = semanticVisualCache.get(cacheKey)
  if (cached) {
    return {
      generationSource: 'deepseek_v4_pro',
      narrative: buildNarrativeFromModel(cached, [], view),
      trace: { requestId, keyConfigured, liveRequestAttempted: false, authenticationSucceeded: null, requestedModel, resultCategory: 'deepseek_cached' },
    }
  }

  let authenticationSucceeded: boolean | null = null
  try {
    const system =
      'You interpret an NCERT Class X concept into a SemanticConceptModel that describes educational meaning only — ' +
      'you never choose a renderer, never emit nodes/edges/graph syntax, never emit visual coordinates, and never emit ' +
      'executable code. Syrka decides how to render your answer. Respond only with strict JSON: ' +
      '{"centralIdea": string, "stages": [{"id": string, "order": number, "role": "context"|"problem"|"cause"|"mechanism"|"intervention"|"outcome", "proposition": string, "illustrationId": string | null}], ' +
      '"actors": [{"id": string, "label": string, "illustrationId": string | null}], ' +
      '"relationships": [{"id": string, "fromActorId": string, "toActorId": string, "kind": "gives_to"|"receives_from"|"enables"|"blocks"|"causes"|"compares_to", "label": string}], ' +
      '"recommendedTemplates": string[]}. actors and relationships are optional — omit them entirely for a concept with no distinct actors (e.g. a pure comparison). ' +
      'Every "proposition" and every relationship "label" MUST be a full, specific statement of what actually happens or is compared (at least 5 words) — ' +
      'never a single word, never a generic connector like "relates to" or "connects to". ' +
      'Valid illustrationId values: farmer, shopkeeper, buyer, coins, barter_exchange, document, institution, resource, exchange_arrows, environment, government, evidence, claim, outcome_check (or null). ' +
      'Valid recommendedTemplates values, most suitable first (up to 3): before_after, problem_solution_outcome, causal_chain, actor_exchange, comparison_columns, classification_board, cycle, hierarchy, timeline. ' +
      '3 to 6 stages. Ground every proposition and relationship in the given concept material only — never invent facts.'
    const user = JSON.stringify({ concept: view.title, description: view.description, explanation: view.explanation.slice(0, 800), keyTerms: view.keyTerms, citation: view.citation })

    const raw = await callLearningDeepSeek(LEARNING_PROVIDER_CONFIG.pro, system, user)
    authenticationSucceeded = true

    const parsed = raw as { centralIdea?: string; stages?: unknown; actors?: unknown; relationships?: unknown; recommendedTemplates?: unknown }
    const model: SemanticConceptModel = {
      schemaVersion: SEMANTIC_CONCEPT_MODEL_SCHEMA_VERSION,
      conceptId: view.conceptId,
      centralIdea: parsed.centralIdea ?? view.title,
      learningObjective: view.description,
      stages: Array.isArray(parsed.stages) ? (parsed.stages as SemanticConceptModel['stages']) : [],
      actors: Array.isArray(parsed.actors) ? (parsed.actors as SemanticConceptModel['actors']) : [],
      relationships: Array.isArray(parsed.relationships) ? (parsed.relationships as SemanticConceptModel['relationships']) : [],
      generatedBy: 'deepseek_v4_pro',
    }

    const validation = validateSemanticModel(model)
    if (!validation.valid) throw new Error(`invalid semantic model: ${validation.issues.join('; ')}`)

    const recommendedTemplates = validateRecommendedTemplates(parsed.recommendedTemplates)
    const sanitisedTemplates = sanitiseRecommendedTemplates(recommendedTemplates, model)
    const primaryTemplate = (sanitisedTemplates[0] ?? 'causal_chain') as VisualTemplateId
    const gate = evaluateVisualInstructionalValue(model, primaryTemplate)
    if (!gate.passes) throw new Error(`semantic model failed instructional-value gate: ${gate.reasons.join('; ')}`)

    semanticVisualCache.set(cacheKey, model)

    return {
      generationSource: 'deepseek_v4_pro',
      narrative: buildNarrativeFromModel(model, recommendedTemplates, view),
      trace: { requestId, keyConfigured, liveRequestAttempted: true, authenticationSucceeded, requestedModel, resultCategory: 'deepseek_live' },
    }
  } catch {
    return {
      generationSource: 'deterministic_fallback',
      narrative: buildVisualNarrative(view),
      trace: { requestId, keyConfigured, liveRequestAttempted: true, authenticationSucceeded: authenticationSucceeded ?? false, requestedModel, resultCategory: 'deterministic_unavailable' },
    }
  }
}
