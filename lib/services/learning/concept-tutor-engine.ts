import type { NcertConceptWorkbenchView } from '@/lib/utilities/ncert-curriculum-projection'

/**
 * CLASSX-001 §4 — one shared, concept-aware Tutor engine used by every
 * Class X concept in every subject (not only the Chemistry demonstration).
 * Every response is a deterministic string built from the concept's own
 * real curriculum data plus the live workbench session state passed in —
 * never a canned, identical script reused across chapters. Honestly
 * labelled throughout: "Deterministic guided Tutor — no live AI called."
 */
export type ConceptTutorAction =
  | 'teach_step_by_step'
  | 'explain_another_way'
  | 'smallest_hint'
  | 'diagnose_response'
  | 'show_example'
  | 'simpler_example'
  | 'harder_example'
  | 'test_me'
  | 'test_me_no_hints'
  | 'transfer_question'
  | 'explain_it_back'
  | 'what_syrka_remembers'
  | 'what_could_become_evidence'
  | 'capability_relationship'
  | 'why_on_odyssey'
  | 'continue_plan'

export interface ConceptTutorSessionState {
  lastResponseText?: string
  hintsUsedCount: number
  attemptsCount: number
  transferAttempted: boolean
  transferSucceeded: boolean
  explainBackGiven: boolean
  missingKeyTerms: string[]
}

const ACTION_LABEL: Record<ConceptTutorAction, string> = {
  teach_step_by_step: 'Teach this concept step by step',
  explain_another_way: 'Explain this another way',
  smallest_hint: 'Give me the smallest useful hint',
  diagnose_response: 'Diagnose my response',
  show_example: 'Show an example',
  simpler_example: 'Give me a simpler example',
  harder_example: 'Give me a harder example',
  test_me: 'Test me',
  test_me_no_hints: 'Test me without hints',
  transfer_question: 'Ask a transfer question',
  explain_it_back: 'Ask me to explain it back',
  what_syrka_remembers: 'Show what Syrka remembers',
  what_could_become_evidence: 'Show what could become Evidence',
  capability_relationship: 'Show the Capability relationship',
  why_on_odyssey: 'Show why this is on my Odyssey',
  continue_plan: 'Continue my personalised plan',
}

export const CONCEPT_TUTOR_ACTIONS = Object.keys(ACTION_LABEL) as ConceptTutorAction[]
export function conceptTutorActionLabel(action: ConceptTutorAction): string {
  return ACTION_LABEL[action]
}

export interface ConceptResponseEvaluation {
  coveredTerms: string[]
  missingTerms: string[]
  coverageRatio: number
  sufficient: boolean
}

/** Deterministic, visible, curriculum-grounded evaluation — not a black-box score. A response is "sufficient" once it covers at least half of the concept's real key terms. */
export function evaluateConceptResponse(responseText: string, keyTerms: string[]): ConceptResponseEvaluation {
  const normalized = responseText.toLowerCase()
  const coveredTerms = keyTerms.filter((t) => normalized.includes(t))
  const missingTerms = keyTerms.filter((t) => !coveredTerms.includes(t))
  const coverageRatio = keyTerms.length === 0 ? 1 : coveredTerms.length / keyTerms.length
  return { coveredTerms, missingTerms, coverageRatio, sufficient: coverageRatio >= 0.5 }
}

function splitIntoSteps(text: string): string[] {
  return text
    .split(/(?<=[.;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function getConceptTutorResponse(action: ConceptTutorAction, view: NcertConceptWorkbenchView, state: ConceptTutorSessionState): string {
  switch (action) {
    case 'teach_step_by_step': {
      const steps = splitIntoSteps(view.explanation)
      return steps.length > 1 ? steps.map((s, i) => `Step ${i + 1}: ${s}`).join(' ') : `${view.title}: ${view.explanation}`
    }
    case 'explain_another_way': {
      if (view.example) return `Another way to see it, using the chapter's own worked case: ${view.example.prompt} — ${view.example.steps.join(' Then, ')}`
      return `Put differently: ${view.description} The key distinction to hold onto is between ${view.keyTerms.slice(0, 2).join(' and ')}.`
    }
    case 'smallest_hint': {
      const missing = state.missingKeyTerms[0]
      return missing ? `Smallest useful hint: your answer hasn't yet mentioned "${missing}" — the chapter treats this as central to ${view.title}.` : `You've covered the main terms already (${view.keyTerms.join(', ')}) — try stating the relationship between them in one sentence.`
    }
    case 'diagnose_response': {
      if (!state.lastResponseText) return 'No response has been submitted yet for this concept — try the activity first, then ask me to diagnose it.'
      const present = view.keyTerms.filter((t) => !state.missingKeyTerms.includes(t))
      return `Your response covers ${present.length} of ${view.keyTerms.length} key ideas (${present.join(', ') || 'none yet'}). ${
        state.missingKeyTerms.length > 0 ? `Missing: ${state.missingKeyTerms.join(', ')}.` : 'That covers everything this concept specifically emphasises.'
      }`
    }
    case 'show_example':
      return view.example ? `${view.example.prompt}: ${view.example.steps.join(' → ')}` : `The chapter's own explanation is the closest worked case here: ${view.explanation}`
    case 'simpler_example':
      return `A simpler version: focus on just one distinction — ${view.keyTerms[0] ?? view.title} versus everything else in "${view.title}." Ignore the other terms for now.`
    case 'harder_example':
      return `A harder version: ${view.transferPrompt}`
    case 'test_me':
    case 'test_me_no_hints':
    case 'transfer_question':
      return view.transferPrompt
    case 'explain_it_back':
      return `Explain it back, unprompted: why does "${view.title}" matter here, and what would change if it didn't hold?`
    case 'what_syrka_remembers':
      return `This session (not persisted past this page load): ${state.attemptsCount} attempt${state.attemptsCount === 1 ? '' : 's'}, ${state.hintsUsedCount} hint${state.hintsUsedCount === 1 ? '' : 's'} used, transfer ${
        state.transferAttempted ? (state.transferSucceeded ? 'succeeded' : 'attempted but not yet independent') : 'not yet attempted'
      }, explain-back ${state.explainBackGiven ? 'given' : 'not yet given'}.`
    case 'what_could_become_evidence':
      return state.transferSucceeded && state.hintsUsedCount === 0
        ? `This would be eligible: an independent transfer with no hints used is exactly what turns a Learning Observation into an Evidence candidate for Faculty review — it does not yet count as accepted Evidence until reviewed.`
        : `Not yet — Evidence eligibility needs an independent transfer (no hints) on this concept. ${
            state.hintsUsedCount > 0 ? 'A hint was used on this attempt, which records as a guided observation instead.' : 'Complete the transfer task independently to become eligible.'
          }`
    case 'capability_relationship':
      return `"${view.title}" supports ${view.capability.name} (${view.capability.domain}) — one concept among several in this chapter and subject that build toward that Capability.`
    case 'why_on_odyssey':
      return `${view.subject} concepts like this one accumulate toward your current curriculum-progression plan — completing it independently is what would move "${view.chapterTitle}" from recommended to verified on your Odyssey.`
    case 'continue_plan':
      return view.nextConcept
        ? `Next in your plan: "${view.nextConcept.title}"${view.nextConcept.chapterId !== view.chapterId ? ` (${view.nextConcept.chapterId === view.chapterId ? '' : 'next chapter'})` : ''}.`
        : `You've reached the end of ${view.subject}'s supplied concepts — no further chapter is available in this demonstration curriculum.`
    default:
      return ''
  }
}
