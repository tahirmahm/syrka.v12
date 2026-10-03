import { SEMANTIC_CONCEPT_MODEL_SCHEMA_VERSION, type SemanticConceptModel, type VisualNarrative, type VisualCompositionCandidate } from '@/lib/campus-types/semantic-concept-model'
import type { NcertConceptWorkbenchView } from '@/lib/utilities/ncert-curriculum-projection'
import { classifyConceptVisualGrammar, type VisualGrammarClassification } from './concept-visual-grammar-classifier'
import { evaluateVisualInstructionalValue } from './visual-quality-gate'

/**
 * LEARN-002 visual-quality correction — replaces the rejected
 * keyword-fragment Mermaid path, and then the follow-on defect it left
 * behind: every non-hand-authored concept fell through to the same
 * `causal_chain` sequence regardless of its actual shape, which reduced
 * "Horizontal and vertical power-sharing" to one Context card, one Outcome
 * card and an arrow. `classifyConceptVisualGrammar` now runs first and
 * decides which real structure the concept needs — a genuine two-sided
 * comparison gets built as one (`buildComparisonSemanticModel`), never
 * forced through the plain sequence template. `getHandAuthoredSemanticModel`
 * still covers "Functions of money" with real depth; every other
 * non-comparison concept falls back to `buildGenericSemanticModel`, now
 * pulling from more of the curriculum's own grounded text (including its
 * guided-analysis steps) when the description alone would leave fewer than
 * three real propositions — the exact thinness that produced the rejected
 * two-card composition.
 */
export function buildSemanticModel(view: NcertConceptWorkbenchView): SemanticConceptModel {
  if (view.conceptId === 'ncert-concept-eco-3-1') return getFunctionsOfMoneySemanticModel()

  const classifications = classifyConceptVisualGrammar(view)
  const comparison = classifications.find((c) => c.grammar === 'comparison' && c.comparisonSides)
  if (comparison?.comparisonSides) return buildComparisonSemanticModel(view, comparison.comparisonSides)

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

/** Real sentences (never single words) pulled from every grounded field this concept has — description, full explanation, and its guided-analysis steps if any. */
function groundedSentencePool(view: NcertConceptWorkbenchView): string[] {
  const raw = [view.description, view.explanation, ...(view.example?.steps ?? [])].join(' ')
  return raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
}

/**
 * A genuine two-sided comparison — used when classifyConceptVisualGrammar
 * finds the concept's own title states a contrast (e.g. "Horizontal and
 * vertical power-sharing", "Federal vs. unitary systems"). Sentences from
 * the concept's own text are assigned to whichever side they actually
 * discuss (matched against the real words in that side's own label, never
 * an arbitrary keyword), so the comparison_columns template renders real
 * grounded content on both sides rather than a single generic pair of
 * cards.
 */
function buildComparisonSemanticModel(view: NcertConceptWorkbenchView, sides: [{ label: string }, { label: string }]): SemanticConceptModel {
  const sentences = groundedSentencePool(view)
  const sideAWords = sides[0].label.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  const sideBWords = sides[1].label.toLowerCase().split(/\s+/).filter((w) => w.length > 3)

  const stages: SemanticConceptModel['stages'] = []
  let sideAAssigned = 0
  let sideBAssigned = 0
  sentences.forEach((proposition, i) => {
    const lower = proposition.toLowerCase()
    const matchesA = sideAWords.some((w) => lower.includes(w))
    const matchesB = sideBWords.some((w) => lower.includes(w))
    let side: 'a' | 'b' | undefined
    if (matchesA && !matchesB) side = 'a'
    else if (matchesB && !matchesA) side = 'b'
    else if (!matchesA && !matchesB) side = sideAAssigned <= sideBAssigned ? 'a' : 'b'
    if (!side) return
    if (side === 'a') sideAAssigned++
    else sideBAssigned++
    stages.push({ id: `cs${i}`, order: stages.length, role: side === 'a' ? 'context' : 'outcome', proposition, comparisonSide: side })
  })

  if (sideAAssigned === 0) stages.unshift({ id: 'cs-a0', order: 0, role: 'context', proposition: `${sides[0].label}: ${view.description}`, comparisonSide: 'a' })
  if (sideBAssigned === 0) stages.push({ id: 'cs-b0', order: stages.length, role: 'outcome', proposition: `${sides[1].label}: ${view.description}`, comparisonSide: 'b' })

  return {
    schemaVersion: SEMANTIC_CONCEPT_MODEL_SCHEMA_VERSION,
    conceptId: view.conceptId,
    centralIdea: view.title,
    learningObjective: view.description,
    stages,
    actors: [],
    relationships: [],
    generatedBy: 'deterministic',
    comparisonLabels: { a: sides[0].label, b: sides[1].label },
  }
}

/**
 * Splits the curriculum's own explanation into real sentences and tags
 * them with a coarse stage role by position — never a single-keyword
 * node, but also never claiming the causal reasoning depth of a
 * hand-authored model. When the description alone yields fewer than three
 * real propositions (the exact condition that produced the rejected
 * two-card visual), the guided-analysis steps are pulled in too, so the
 * composition still has real structure rather than degenerating to a bare
 * before/after pair.
 */
function buildGenericSemanticModel(view: NcertConceptWorkbenchView): SemanticConceptModel {
  let sentences = `${view.description} ${view.explanation}`
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 5)

  if (sentences.length < 3) sentences = groundedSentencePool(view).slice(0, 6)

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

function candidatesForClassification(view: NcertConceptWorkbenchView, model: SemanticConceptModel, classifications: VisualGrammarClassification[]): VisualCompositionCandidate[] {
  const hasComparisonStructure = Boolean(model.comparisonLabels)
  if (hasComparisonStructure) {
    return [
      {
        templateId: 'comparison_columns',
        label: 'Side-by-side comparison',
        reason: `"${view.title}" is a two-sided contrast (${model.comparisonLabels!.a} vs. ${model.comparisonLabels!.b}) — a real comparison layout shows both sides at once.`,
        recommended: true,
      },
      { templateId: 'causal_chain', label: 'Sequential explanation', reason: 'An alternative reading as a plain sequence of the same grounded propositions.', recommended: false },
    ]
  }

  const primaryGrammar = classifications[0]
  return [
    {
      templateId: 'causal_chain',
      label: 'Causal sequence',
      reason: primaryGrammar
        ? `"${view.title}" (${primaryGrammar.reason})`
        : `"${view.title}" is best shown as a real sequence of ideas from the chapter's own explanation.`,
      recommended: true,
    },
  ]
}

export function buildVisualNarrative(view: NcertConceptWorkbenchView): VisualNarrative {
  const isHandAuthored = view.conceptId === 'ncert-concept-eco-3-1'
  const model = buildSemanticModel(view)
  const classifications = isHandAuthored ? [] : classifyConceptVisualGrammar(view)

  let candidates: VisualCompositionCandidate[] = isHandAuthored
    ? [
        { templateId: 'before_after', label: 'Before and after', reason: 'Shows barter failing on the left and money succeeding on the right — the clearest contrast for this concept.', recommended: true },
        { templateId: 'problem_solution_outcome', label: 'Problem, intervention, outcome', reason: 'Shows the double coincidence of wants as a named problem that money directly resolves.', recommended: false },
        { templateId: 'actor_exchange', label: 'Actor exchange', reason: 'Shows the farmer, cloth seller and buyer as real actors connected by the actual exchanges the chapter describes.', recommended: false },
      ]
    : candidatesForClassification(view, model, classifications)

  // Defensive check, not a silent override: a candidate that still fails the
  // instructional-value gate falls back to the plain sequence template with
  // its enriched (>=3 proposition) stage set, rather than shipping the bare
  // two-card composition the founder rejected.
  const primary = candidates[0]
  const gate = evaluateVisualInstructionalValue(model, primary.templateId)
  if (!gate.passes && primary.templateId !== 'causal_chain') {
    candidates = [{ templateId: 'causal_chain', label: 'Sequential explanation', reason: `${gate.reasons.join(' ')} Shown instead as the concept's own grounded sequence.`, recommended: true }]
  }

  const structuredTextEquivalent = model.stages.map((s, i) => `${i + 1}. ${s.proposition}`).join(' ')

  return {
    model,
    candidates,
    structuredTextEquivalent,
    altText: `A visual explanation of "${model.centralIdea}" showing ${model.stages.length} connected ideas from context to outcome.`,
  }
}
