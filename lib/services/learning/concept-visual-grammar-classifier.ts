/**
 * Visual semantic quality correction — the classification stage that runs
 * BEFORE a template is chosen. The prior defect: every concept without a
 * hand-authored model fell through to the same `causal_chain` sequence
 * regardless of the concept's actual shape, which reduced "Horizontal and
 * vertical power-sharing" to one Context card, one Outcome card and an
 * arrow — a real institutional comparison rendered as if it were a plain
 * narrative. This classifier reads the concept's own curriculum text (never
 * isolated keywords in isolation — every signal below requires a real
 * structural pattern, not a single matched word) and proposes which visual
 * grammar the concept actually needs. It is consulted, never overridden,
 * by the deterministic model builder and by the DeepSeek fallback check.
 */

export type VisualGrammar =
  | 'comparison'
  | 'hierarchy'
  | 'institutional_system'
  | 'actor_relationship'
  | 'process'
  | 'causal_mechanism'
  | 'before_after'
  | 'classification'
  | 'timeline'
  | 'argument_evidence'
  | 'cycle'
  | 'exchange'
  | 'spatial_system'
  | 'quantitative_relationship'
  | 'decision_scenario'
  | 'data_story'

export interface ComparisonSide {
  label: string
}

export interface VisualGrammarClassification {
  grammar: VisualGrammar
  confidence: 'high' | 'medium'
  reason: string
  /** Populated only for grammar === 'comparison' — the two sides the concept's own title names. */
  comparisonSides?: [ComparisonSide, ComparisonSide]
}

export interface ClassifiableConceptText {
  title: string
  description: string
  explanation: string
}

/** The title itself states a two-sided contrast ("Federal vs. unitary systems") — a structural pattern, not a keyword. */
const TITLE_CONTRAST_PATTERN = /^(.+?)\s+(?:vs\.?|versus)\s+(.+)$/i
/** Government institutions named at the same level of authority. */
const INSTITUTIONAL_SIGNAL = /\b(legislature|executive|judiciary|parliament|organs? of government|council of ministers)\b/i
/** Government levels — required alongside INSTITUTIONAL_SIGNAL to distinguish a multi-level system from a single-institution mention. */
const MULTI_LEVEL_SIGNAL = /\b(union|central government|state government|local government|panchayat|municipalit\w*|different levels of government|same level of government|higher and lower levels|tiers? of government)\b/i
const TIMELINE_SIGNAL = /\b(evolution|shift(?:ed)? from|over time|dominance to|since independence|historically|era of|decades?)\b/i
const CLASSIFICATION_SIGNAL = /\b(types of|classify|classification|categories of|kinds of)\b/i
const EXCHANGE_SIGNAL = /\b(barter|exchange|trade[sd]?|buys?|sells?|pays?|medium of)\b/i
const HIERARCHY_SIGNAL = /\b(tiers?|levels? of authority|reports? to|subordinate|apex|ranked above)\b/i
const QUANTITATIVE_SIGNAL = /\b(rate|interest|proportion|percentage|burden scales|graph)\b/i

/**
 * Returns up to three grammars, most confident first. Never returns an
 * empty array — a concept matching no structural signal is still a real
 * grounded sequence of the chapter's own propositions ('process'), which is
 * a legitimate visual shape for genuinely sequential concepts. The quality
 * gate (visual-quality-gate.ts), not this classifier, is what catches a
 * 'process' composition that degenerates into two bare cards.
 */
export function classifyConceptVisualGrammar(input: ClassifiableConceptText): VisualGrammarClassification[] {
  const haystack = `${input.title} ${input.description} ${input.explanation}`
  const results: VisualGrammarClassification[] = []

  const titleContrast = input.title.match(TITLE_CONTRAST_PATTERN)
  if (titleContrast) {
    results.push({
      grammar: 'comparison',
      confidence: 'high',
      reason: `The concept title itself states a two-sided contrast ("${titleContrast[1].trim()}" vs. "${titleContrast[2].trim()}") — this is a comparison, not a narrative sequence.`,
      comparisonSides: [{ label: titleContrast[1].trim() }, { label: titleContrast[2].trim() }],
    })
  }

  const hasInstitutions = INSTITUTIONAL_SIGNAL.test(haystack)
  const hasMultiLevel = MULTI_LEVEL_SIGNAL.test(haystack)
  if (hasInstitutions && hasMultiLevel) {
    results.push({
      grammar: 'institutional_system',
      confidence: 'high',
      reason: 'The concept names specific government institutions operating across specific levels of government — this needs an institutional map, not a causal sequence.',
    })
  } else if (hasInstitutions) {
    results.push({ grammar: 'institutional_system', confidence: 'medium', reason: 'The concept names specific government institutions.' })
  } else if (hasMultiLevel) {
    results.push({ grammar: 'institutional_system', confidence: 'medium', reason: 'The concept describes authority split across levels of government.' })
  }

  if (CLASSIFICATION_SIGNAL.test(haystack)) {
    results.push({ grammar: 'classification', confidence: 'medium', reason: 'The concept groups real instances into named categories a learner must tell apart.' })
  }
  if (TIMELINE_SIGNAL.test(haystack)) {
    results.push({ grammar: 'timeline', confidence: 'medium', reason: 'The concept describes a change across a historical period.' })
  }
  if (HIERARCHY_SIGNAL.test(haystack)) {
    results.push({ grammar: 'hierarchy', confidence: 'medium', reason: 'The concept describes authority ranked above or below other authority.' })
  }
  if (EXCHANGE_SIGNAL.test(haystack)) {
    results.push({ grammar: 'exchange', confidence: 'medium', reason: 'The concept describes an exchange between distinct actors.' })
  }
  if (QUANTITATIVE_SIGNAL.test(haystack)) {
    results.push({ grammar: 'quantitative_relationship', confidence: 'medium', reason: 'The concept involves a relationship that changes continuously with a variable.' })
  }

  if (results.length === 0) {
    results.push({ grammar: 'process', confidence: 'medium', reason: "The concept is best explained as a grounded sequence of the chapter's own propositions." })
  }

  return results.slice(0, 3)
}
