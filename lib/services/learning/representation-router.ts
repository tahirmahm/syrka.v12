import type { LearningRenderer } from '@/lib/campus-types/learning-renderer'
import type { RepresentationInput, RepresentationDecision } from './providers/types'

/**
 * LEARN-002 §7/§6 — the deterministic renderer-selection engine. A pure
 * function, not a DeepSeek call, so representation choice works and is
 * explainable even when no model is configured. Mermaid and any other
 * generic node-edge graph engine are not part of Syrka's renderer set at
 * all (see learning-renderer.ts) — this function can never select one,
 * and never lists one as a considered alternative, because none exists
 * to consider.
 *
 * Every branch here marks its decision mandatory. This is deliberate: a live
 * model was found able to override an authored 3D scene (and, before
 * that, this router's Mermaid-avoidance choices) simply because its
 * prompt happened to still offer a renderer list. Renderer eligibility is
 * now decided in code only — DeepSeek is never consulted for the
 * renderer field at all (see selectRepresentation() in
 * deepseek-teaching-provider.ts, which returns this decision unmodified).
 */
export function selectRepresentationDeterministic(input: RepresentationInput): RepresentationDecision {
  const { view, sessionState, device, scaffoldLevel } = input
  const alternativesConsidered: { renderer: LearningRenderer; rejectedBecause: string }[] = []

  // Reduced-motion / low scaffold at assessment time: prefer the static/text path.
  if (scaffoldLevel === 'independent') {
    alternativesConsidered.push({ renderer: 'syrka_visual', rejectedBecause: 'A visual aid during independent assessment would make the attempt guided, not independent.' })
    return {
      renderer: 'structured_text',
      reason: 'Assessment purpose is independent — no visual support is shown so the attempt can count toward Evidence.',
      alternativesConsidered,
      expectedLearnerSignal: 'Correct, unaided reasoning in the student\'s own words.',
      mandatory: true,
    }
  }

  const subject = view.subject.toLowerCase()

  if (view.chapterId === 'ncert-chapter-geo-1' && view.conceptId === 'ncert-concept-geo-1-2') {
    alternativesConsidered.push(
      { renderer: 'syrka_visual', rejectedBecause: 'A flat composed infographic cannot show how extraction pressure in one parcel compounds runoff into a neighbouring one over time — this is a spatial, layered relationship.' },
      { renderer: 'custom_interactive', rejectedBecause: 'A 2D diagram can show classification but not the terrain-level spatial relationship between soil, extraction and long-term degradation that this concept is actually about.' }
    )
    return {
      renderer: 'three_scene',
      reason: 'Land degradation here is a spatial, layered process across neighbouring parcels — a rotatable terrain model that responds to a chosen extraction level demonstrates the runoff relationship more directly than a flat diagram.',
      alternativesConsidered,
      expectedLearnerSignal: 'Predicts and explains how extraction intensity and conservation choice change long-term soil productivity across regions, without the animated guidance present.',
      mandatory: true,
    }
  }

  // "Horizontal and vertical power-sharing" is a genuine institutional
  // comparison, not a narrative sequence — the generic fallback previously
  // reduced it to one Context card, one Outcome card and a downward arrow
  // (a "reformat the prose in boxes" composition the founder rejected on
  // sight). A dedicated bespoke interactive is required, exactly like
  // Types of farming below.
  if (subject === 'political science' && view.conceptId === 'ncert-concept-pol-1-1') {
    alternativesConsidered.push(
      { renderer: 'syrka_visual', rejectedBecause: 'A generated composition here degenerates into two large text cards with no institutional or spatial structure — this concept needs a real side-by-side institution/level comparison, not a narrative sequence.' },
      { renderer: 'structured_text', rejectedBecause: 'Comparing three institutions at one level against three levels of government in prose alone loses the side-by-side and same-level-vs-different-level structure entirely.' }
    )
    return {
      renderer: 'custom_interactive',
      reason: 'Horizontal and vertical power-sharing is a genuine institutional comparison — a dedicated side-by-side composition (legislature/executive/judiciary at one level; Union/State/Local across levels) plus a scenario-classification exercise teaches the distinction directly, which no generated diagram does.',
      alternativesConsidered,
      expectedLearnerSignal: 'Correctly classifies a new governance example as horizontal, vertical, both or neither, and explains which structural feature (same level vs. different level) determined the answer.',
      mandatory: true,
    }
  }

  // "Types of farming" is a real classification/comparison task, not a flat
  // concept map — a single "distinction" node fanned out to isolated
  // keywords ("primitive"/"subsistence"/"intensive"/"commercial") was the
  // rejected Mermaid rendering this router must never reproduce with any
  // other renderer either.
  if (subject === 'geography' && view.conceptId === 'ncert-concept-geo-4-2') {
    alternativesConsidered.push(
      { renderer: 'syrka_visual', rejectedBecause: 'A static composed infographic cannot let the student actually classify a farming scenario and get feedback — this needs a real interactive comparison.' },
      { renderer: 'structured_text', rejectedBecause: 'Comparing six criteria across three farming types in prose alone loses the side-by-side structure a learner needs to compare them.' }
    )
    return {
      renderer: 'custom_interactive',
      reason: 'Types of farming is a genuine multi-criteria comparison and classification task — a real comparison table plus a classify-the-scenario exercise teaches this better than any generated diagram.',
      alternativesConsidered,
      expectedLearnerSignal: 'Correctly classifies a new, unpractised farming scenario and explains which criteria (purpose, technology, labour, scale, market orientation) determined the answer.',
      mandatory: true,
    }
  }

  // Only "Formal vs. informal credit" is actually graphable (repayment burden vs. rate/term/principal).
  // "Functions of money" (eco-3-1) is a conceptual explanation, not a quantitative relationship — routing
  // it to a graph was itself a defect, distinct from (but related to) the earlier keyword-fragment defect.
  // Mafs (a real learner-manipulable graph — draggable inspector point, live parameter controls) is the
  // primary teaching interaction here; a static Desmos embed with no prediction/transfer sequence around
  // it was found insufficient on its own and is no longer the primary renderer for this concept.
  if (subject === 'economics' && view.conceptId === 'ncert-concept-eco-3-2') {
    alternativesConsidered.push(
      { renderer: 'syrka_visual', rejectedBecause: 'A composed infographic cannot show how repayment burden scales continuously with rate and term — this needs a real graph.' },
      { renderer: 'desmos', rejectedBecause: 'A bare graphing calculator has no built-in predict/manipulate/explain/transfer sequence and no learner-facing prediction point on the curve — the concept needs the full interaction, not just an equation view.' }
    )
    return {
      renderer: 'mafs_graph',
      reason: 'Formal vs. informal credit involves a genuinely graphable, learner-manipulable relationship (repayment burden vs. rate/term/principal) — principal, both rates and the repayment period are all directly controllable, with a draggable inspector point on the curve.',
      alternativesConsidered,
      expectedLearnerSignal: 'Correctly predicts which credit source costs more, explains why the gap widens over time, then estimates a new formal/informal comparison without the graph.',
      mandatory: true,
    }
  }

  if (subject === 'economics' && view.conceptId === 'ncert-concept-eco-3-1') {
    alternativesConsidered.push(
      { renderer: 'desmos', rejectedBecause: 'Functions of money is a conceptual explanation, not a quantitative relationship — there is nothing to graph.' },
      { renderer: 'structured_text', rejectedBecause: 'Prose alone loses the actual before/after contrast that makes barter\'s failure and money\'s solution vivid.' }
    )
    return {
      renderer: 'syrka_visual',
      reason: 'Barter failing vs. money succeeding is a clean before/after contrast — a composed infographic shows the actual reasoning.',
      alternativesConsidered,
      expectedLearnerSignal: 'Explains why the double coincidence of wants blocks barter and how money removes that requirement, in their own words.',
      mandatory: true,
    }
  }

  if (sessionState.hintsUsedCount >= 2) {
    alternativesConsidered.push({ renderer: 'structured_text', rejectedBecause: 'Two hints in the same format have not resolved the difficulty — text alone is unlikely to help further.' })
    return {
      renderer: 'syrka_visual',
      reason: 'Repeated difficulty in the same representation suggests a visual restructuring of the relationship, not another hint in the same format.',
      alternativesConsidered,
      expectedLearnerSignal: 'Recognises the relationship once it is shown structurally rather than only in prose.',
      mandatory: true,
    }
  }

  if (device === 'mobile') {
    alternativesConsidered.push({ renderer: 'desmos', rejectedBecause: 'Desmos benefits from a larger viewport for expression entry; not the first choice on mobile for an introductory pass.' })
  }

  alternativesConsidered.push(
    { renderer: 'custom_interactive', rejectedBecause: 'No bespoke interactive has been built for this concept in this pass.' }
  )

  return {
    renderer: 'syrka_visual',
    reason: `"${view.title}" is shown as a real sequence of ideas from the chapter's own explanation, composed into a Syrka visual template.`,
    alternativesConsidered,
    expectedLearnerSignal: 'Can explain the sequence of ideas in their own words.',
    mandatory: true,
  }
}
