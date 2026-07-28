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

  if (view.chapterId === 'ncert-chapter-geo-1' && view.conceptId === 'ncert-concept-geo-1-2') {
    alternativesConsidered.push(
      { renderer: 'mermaid', rejectedBecause: 'A flat concept map cannot show how extraction pressure in one parcel compounds runoff into a neighbouring one over time — this is a spatial, layered relationship.' },
      { renderer: 'custom_react', rejectedBecause: 'A 2D diagram can show classification but not the terrain-level spatial relationship between soil, extraction and long-term degradation that this concept is actually about.' }
    )
    return {
      renderer: 'three_scene',
      reason: 'Land degradation here is a spatial, layered process across neighbouring parcels — a rotatable terrain model that responds to a chosen extraction level demonstrates the runoff relationship more directly than a flat diagram.',
      alternativesConsidered,
      expectedLearnerSignal: 'Predicts and explains how extraction intensity and conservation choice change long-term soil productivity across regions, without the animated guidance present.',
    }
  }

  // Only "Formal vs. informal credit" is actually graphable (repayment burden vs. rate/term/principal).
  // "Functions of money" (eco-3-1) is a conceptual explanation, not a quantitative relationship — routing
  // it to Desmos was itself a defect, distinct from (but related to) the Mermaid keyword-fragment defect.
  if (subject === 'economics' && view.conceptId === 'ncert-concept-eco-3-2') {
    alternativesConsidered.push({ renderer: 'syrka_visual', rejectedBecause: 'A composed infographic cannot show how repayment burden scales continuously with rate and term — this needs a real graph.' })
    return {
      renderer: 'desmos',
      reason: 'Formal vs. informal credit involves a genuinely graphable relationship (repayment burden vs. rate/term/principal).',
      alternativesConsidered,
      expectedLearnerSignal: 'Correctly predicts how burden changes as one variable is adjusted.',
    }
  }

  if (subject === 'economics' && view.conceptId === 'ncert-concept-eco-3-1') {
    alternativesConsidered.push(
      { renderer: 'desmos', rejectedBecause: 'Functions of money is a conceptual explanation, not a quantitative relationship — there is nothing to graph.' },
      { renderer: 'mermaid', rejectedBecause: 'A concept map reduced to isolated keywords ("solves", "double", "coincidence") loses the actual reasoning — this needs a real before/after contrast.' }
    )
    return {
      renderer: 'syrka_visual',
      reason: 'Barter failing vs. money succeeding is a clean before/after contrast — a composed infographic shows the actual reasoning, not a keyword graph.',
      alternativesConsidered,
      expectedLearnerSignal: 'Explains why the double coincidence of wants blocks barter and how money removes that requirement, in their own words.',
    }
  }

  if (sessionState.hintsUsedCount >= 2) {
    alternativesConsidered.push({ renderer: 'structured_text', rejectedBecause: 'Two hints in the same format have not resolved the difficulty — text alone is unlikely to help further.' })
    return {
      renderer: 'syrka_visual',
      reason: 'Repeated difficulty in the same representation suggests a visual restructuring of the relationship, not another hint in the same format.',
      alternativesConsidered,
      expectedLearnerSignal: 'Recognises the relationship once it is shown structurally rather than only in prose.',
    }
  }

  if (device === 'mobile') {
    alternativesConsidered.push({ renderer: 'desmos', rejectedBecause: 'Desmos benefits from a larger viewport for expression entry; not the first choice on mobile for an introductory pass.' })
  }

  alternativesConsidered.push(
    { renderer: 'custom_react', rejectedBecause: 'No bespoke interactive has been built for this concept in this pass.' },
    { renderer: 'mermaid', rejectedBecause: 'Mermaid is retained only as an internal/technical alternative, never the ordinary Student-facing default — a real sentence sequence composed as an infographic teaches better than a node/edge graph of isolated keywords.' }
  )

  return {
    renderer: 'syrka_visual',
    reason: `"${view.title}" is shown as a real sequence of ideas from the chapter's own explanation, not a graph of isolated keywords.`,
    alternativesConsidered,
    expectedLearnerSignal: 'Can explain the sequence of ideas in their own words.',
  }
}
