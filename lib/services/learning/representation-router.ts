import type { LearningVisualRenderer } from '@/lib/campus-types/learning-visual-spec'
import type { RepresentationInput, RepresentationDecision } from './providers/types'

/**
 * LEARN-002 §7/§6 — the deterministic renderer-selection engine. A pure
 * function, not a DeepSeek call, so representation choice works and is
 * explainable even when no model is configured. Every renderer this pass
 * actually ships (Mermaid, Desmos, one custom Economics interactive,
 * structured text) is a possible outcome; Excalidraw is listed as a
 * recognised renderer for future compatibility but is never selected by
 * this router in this pass (not integrated — see the ADR §12).
 */
export function selectRepresentationDeterministic(input: RepresentationInput): RepresentationDecision {
  const { view, sessionState, device, scaffoldLevel } = input
  const alternativesConsidered: { renderer: LearningVisualRenderer; rejectedBecause: string }[] = []

  // Reduced-motion / low scaffold at assessment time: prefer the static/text path.
  if (scaffoldLevel === 'independent') {
    alternativesConsidered.push({ renderer: 'mermaid', rejectedBecause: 'A visual aid during independent assessment would make the attempt guided, not independent.' })
    return {
      renderer: 'structured_text',
      reason: 'Assessment purpose is independent — no visual support is shown so the attempt can count toward Evidence.',
      alternativesConsidered,
      expectedLearnerSignal: 'Correct, unaided reasoning in the student\'s own words.',
    }
  }

  const subject = view.subject.toLowerCase()

  if (subject === 'economics' && view.chapterId === 'ncert-chapter-eco-3') {
    alternativesConsidered.push({ renderer: 'mermaid', rejectedBecause: 'A concept map cannot show how repayment burden scales continuously with rate and term — this needs a real graph.' })
    return {
      renderer: 'desmos',
      reason: 'Money and Credit concept 1 (Functions of money) and concept 2 (Formal vs. informal credit) both involve a genuinely graphable relationship (repayment burden vs. rate/term/principal).',
      alternativesConsidered,
      expectedLearnerSignal: 'Correctly predicts how burden changes as one variable is adjusted.',
    }
  }

  if (sessionState.hintsUsedCount >= 2) {
    alternativesConsidered.push({ renderer: 'structured_text', rejectedBecause: 'Two hints in the same format have not resolved the difficulty — text alone is unlikely to help further.' })
    return {
      renderer: 'mermaid',
      reason: 'Repeated difficulty in the same representation suggests a visual restructuring of the relationship, not another hint in the same format.',
      alternativesConsidered,
      expectedLearnerSignal: 'Recognises the relationship once it is shown structurally rather than only in prose.',
    }
  }

  if (device === 'mobile') {
    alternativesConsidered.push({ renderer: 'desmos', rejectedBecause: 'Desmos benefits from a larger viewport for expression entry; not the first choice on mobile for an introductory pass.' })
  }

  alternativesConsidered.push({ renderer: 'custom_react', rejectedBecause: 'No bespoke interactive has been built for this concept in this pass.' })

  return {
    renderer: 'mermaid',
    reason: `"${view.title}" is well suited to a concept map of its key ideas (${view.keyTerms.slice(0, 3).join(', ')}).`,
    alternativesConsidered,
    expectedLearnerSignal: 'Can explain how the terms in the map relate to each other in their own words.',
  }
}
