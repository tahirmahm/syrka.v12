import { SEMANTIC_CONCEPT_MODEL_SCHEMA_VERSION, type SemanticConceptModel, type VisualNarrative, type VisualCompositionCandidate } from '@/lib/campus-types/semantic-concept-model'
import type { NcertConceptWorkbenchView } from '@/lib/utilities/ncert-curriculum-projection'

/**
 * LEARN-002 visual-quality correction — replaces the rejected
 * keyword-fragment Mermaid path. `getHandAuthoredSemanticModel` covers
 * one concept with real depth (the specific rejected example, Economics
 * "Functions of money"); every other concept falls back to
 * `buildGenericSemanticModel`, which splits the curriculum's own
 * explanation into real sentences (never isolated keywords) and tags
 * them with a best-effort stage role. This fallback is honestly lower
 * quality than the hand-authored case — it produces a real sentence
 * sequence, not a deeply reasoned causal model — and is disclosed as
 * such in the ADR.
 */
export function buildSemanticModel(view: NcertConceptWorkbenchView): SemanticConceptModel {
  if (view.conceptId === 'ncert-concept-eco-3-1') return getFunctionsOfMoneySemanticModel()
  return buildGenericSemanticModel(view)
}

function getFunctionsOfMoneySemanticModel(): SemanticConceptModel {
  return {
    schemaVersion: SEMANTIC_CONCEPT_MODEL_SCHEMA_VERSION,
    conceptId: 'ncert-concept-eco-3-1',
    centralIdea: 'Money exists because barter often fails to match what each side wants.',
    learningObjective: 'Explain why the double coincidence of wants makes barter unreliable, and how money removes that requirement.',
    stages: [
      { id: 's0', order: 0, role: 'context', proposition: 'A farmer has wheat and wants cloth.', illustrationId: 'farmer' },
      { id: 's1', order: 1, role: 'problem', proposition: 'The cloth seller may not want wheat in return — the exchange has no reason to happen.', illustrationId: 'shopkeeper' },
      { id: 's2', order: 2, role: 'cause', proposition: 'This is the double coincidence of wants: barter only works when both sides want exactly what the other offers.', illustrationId: 'barter_exchange' },
      { id: 's3', order: 3, role: 'intervention', proposition: 'Money provides a medium of exchange that everyone already accepts, regardless of what they personally want right now.', illustrationId: 'coins' },
      { id: 's4', order: 4, role: 'outcome', proposition: 'The farmer sells wheat for money, then uses that money to buy cloth elsewhere — no matching of wants is required.', illustrationId: 'exchange_arrows' },
    ],
    actors: [
      { id: 'a-farmer', label: 'Farmer', illustrationId: 'farmer' },
      { id: 'a-clothseller', label: 'Cloth seller', illustrationId: 'shopkeeper' },
      { id: 'a-buyer', label: 'Wheat buyer', illustrationId: 'buyer' },
    ],
    relationships: [
      { id: 'r0', fromActorId: 'a-farmer', toActorId: 'a-buyer', kind: 'gives_to', label: 'sells wheat for money' },
      { id: 'r1', fromActorId: 'a-farmer', toActorId: 'a-clothseller', kind: 'gives_to', label: 'pays money for cloth' },
    ],
    misconception: 'Money is not just "more convenient" barter — it removes the requirement that both sides want each other\'s specific goods at all.',
    generatedBy: 'deterministic',
  }
}

/**
 * Splits the curriculum's own explanation into real sentences and tags
 * them with a coarse stage role by position — never a single-keyword
 * node, but also never claiming the causal reasoning depth of a
 * hand-authored model. Used for the 51 concepts this pass did not
 * hand-author.
 */
function buildGenericSemanticModel(view: NcertConceptWorkbenchView): SemanticConceptModel {
  const sentences = `${view.description} ${view.explanation}`
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 5)

  const roleForIndex = (i: number, total: number): SemanticStage['role'] => {
    if (i === 0) return 'context'
    if (i === total - 1) return 'outcome'
    if (i === 1) return 'problem'
    return 'mechanism'
  }

  const stages = sentences.map((proposition, i) => ({
    id: `gs${i}`,
    order: i,
    role: roleForIndex(i, sentences.length),
    proposition,
  }))

  return {
    schemaVersion: SEMANTIC_CONCEPT_MODEL_SCHEMA_VERSION,
    conceptId: view.conceptId,
    centralIdea: view.title,
    learningObjective: view.description,
    stages: stages.length ? stages : [{ id: 'gs0', order: 0, role: 'context', proposition: view.description }],
    actors: [],
    relationships: [],
    generatedBy: 'deterministic',
  }
}

type SemanticStage = SemanticConceptModel['stages'][number]

export function buildVisualNarrative(view: NcertConceptWorkbenchView): VisualNarrative {
  const model = buildSemanticModel(view)
  const isHandAuthored = view.conceptId === 'ncert-concept-eco-3-1'

  const candidates: VisualCompositionCandidate[] = isHandAuthored
    ? [
        { templateId: 'before_after', label: 'Before and after', reason: 'Shows barter failing on the left and money succeeding on the right — the clearest contrast for this concept.', recommended: true },
        { templateId: 'problem_solution_outcome', label: 'Problem, intervention, outcome', reason: 'Shows the double coincidence of wants as a named problem that money directly resolves.', recommended: false },
      ]
    : [{ templateId: 'causal_chain', label: 'Causal sequence', reason: `"${view.title}" is best shown as a real sequence of ideas from the chapter's own explanation.`, recommended: true }]

  const structuredTextEquivalent = model.stages.map((s, i) => `${i + 1}. ${s.proposition}`).join(' ')

  return {
    model,
    candidates,
    structuredTextEquivalent,
    altText: `A visual explanation of "${model.centralIdea}" showing ${model.stages.length} connected ideas from context to outcome.`,
  }
}
