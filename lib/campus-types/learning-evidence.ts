/**
 * The single connection point between Syrka Learning and Passport
 * Intelligence Stage A (lib/campus-types/profile.ts). Learning does not
 * get its own top-level SourceCategory (it stays 'campus_learning',
 * already modelled) and does not get a parallel inference system — a
 * Learning-derived EvidenceCandidate flows through the exact same
 * EvidenceCandidate -> CapabilityInferenceBasis -> CapabilityInference
 * pipeline every other source uses. This subtype is the only
 * Learning-specific detail added to that pipeline.
 */
export type LearningEvidenceSubtype =
  | 'independent_transfer'
  | 'assessed_response'
  | 'project'
  | 'practical_observation'
  | 'exam_attempt'
  | 'written_explanation'
