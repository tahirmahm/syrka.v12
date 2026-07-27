/**
 * Syrka Learning — content domain (what is being taught). Kept separate
 * from the interaction domain (learning-interaction.ts), the observation
 * domain (learning-observation.ts), Evidence/Capability/Odyssey/Passport
 * (untouched), and the source/provenance domain (learning-source.ts). No
 * single LearningActivity or LearningProfile object.
 */

export interface LearningCurriculum {
  id: string
  title: string
  /** e.g. "NCERT Class X Science" — a label, never a claim of publisher endorsement. See learning-governance.ts's copyright/source-control posture. */
  subjectLabel: string
  institutionId?: string
  ownerId: string
}

export interface LearningCourse {
  id: string
  curriculumId: string
  title: string
  gradeLevel?: string
}

export interface LearningUnit {
  id: string
  courseId: string
  title: string
  order: number
}

export interface LearningChapter {
  id: string
  unitId: string
  title: string
  order: number
  /** e.g. "Chemical Reactions and Equations" — the Chapter 1 vertical slice's own id lives here, not hardcoded elsewhere. */
  sourceDocumentId?: string
}

export interface LearningLesson {
  id: string
  chapterId: string
  title: string
  order: number
  conceptIds: string[]
}

export interface LearningSection {
  id: string
  lessonId: string
  title: string
  order: number
  sourceReferenceIds: string[]
}

export interface LearningConcept {
  id: string
  title: string
  description: string
  domain: string
}

/** Concept-to-concept only — mirrors CapabilityRelationEdge's own REQUIRES/DEPENDS_ON split (lib/campus-types/capability.ts), applied to Learning concepts instead of Capabilities. */
export interface LearningPrerequisite {
  id: string
  conceptId: string
  requiresConceptId: string
}

export interface LearningExplanation {
  id: string
  conceptId: string
  /** Original Syrka-authored explanation — never a reproduction of the source textbook (see learning-governance.ts §copyright). */
  body: string
  sourceReferenceIds: string[]
}

export interface WorkedExample {
  id: string
  conceptId: string
  prompt: string
  steps: string[]
  sourceReferenceIds: string[]
}

export type LearningActivityKind = 'practical' | 'discussion' | 'writing' | 'project' | 'revision_card'

export interface LearningActivity {
  id: string
  lessonId: string
  kind: LearningActivityKind
  title: string
  instructions: string
  /** Practical-activity safety classification — see learning-visibility.ts / the safety policy in the checkpoint report. */
  safetyClassification?: 'safe_independent' | 'adult_supervision_recommended' | 'teacher_supervision_required' | 'simulation_only' | 'do_not_attempt'
  safetyWarningSourceReferenceId?: string
}

export type LearningQuestionKind = 'diagnostic' | 'practice' | 'transfer' | 'reflection'

export interface LearningQuestion {
  id: string
  conceptId: string
  kind: LearningQuestionKind
  prompt: string
  /** Points at the Answer Key Vault (learning-answer-key.ts), never the answer content itself. */
  answerKeyEntryId: string
  sourceReferenceIds: string[]
}

export interface LearningFigure {
  id: string
  conceptId: string
  caption: string
  sourceReferenceId?: string
  /** A figure sourced from the original material vs. a Syrka-rendered deterministic visual (learning-visual.ts) it stands in for. */
  origin: 'source_material' | 'syrka_deterministic_visual'
}

export interface LearningEquation {
  id: string
  conceptId: string
  /** Rendered form, e.g. LaTeX or a structured chemical-equation representation — not prose. */
  expression: string
  sourceReferenceId?: string
}
