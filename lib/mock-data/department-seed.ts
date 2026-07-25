import type {
  ProgrammeOutcome,
  ProgrammeCapabilityRelationship,
  AssessmentEvidenceRequirement,
  Cohort,
  CurriculumAlignmentIssue,
  DepartmentIntervention,
} from '@/lib/campus-types'

/**
 * Department-only institutional facts that can't be derived from
 * Programme/Course/Capability/Evidence data (declared outcomes, design-time
 * assessment intent, cohort membership, seeded interventions). Everything
 * else — coverage percentages, review ageing, curriculum-alignment
 * computation, analytics — is computed by department-repository.ts from
 * this plus the existing Capability/Evidence/Faculty/Odyssey/Passport seed,
 * never hardcoded here as a fabricated statistic.
 *
 * This mock dataset models exactly one cohort of one real student
 * (student-1, matching every other Campus domain), so cohort-level views
 * are honestly small-N rather than padded with fabricated peers — the same
 * disclosed constraint faculty-seed.ts documents for listFacultyStudents.
 */

export const programmeOutcomes: ProgrammeOutcome[] = [
  {
    id: 'outcome-1',
    programmeId: 'prog-1',
    title: 'Analyze data rigorously using statistical and computational methods',
    description: 'Graduates can select, apply, and justify statistical and machine-learning methods to draw valid conclusions from real datasets.',
    capabilityIds: ['cap-1', 'cap-2', 'cap-4'],
  },
  {
    id: 'outcome-2',
    programmeId: 'prog-1',
    title: 'Design and conduct original research',
    description: 'Graduates can design a well-controlled research study and defend its methodology against common threats to validity.',
    capabilityIds: ['cap-3'],
  },
]

export const programmeCapabilityRelationships: ProgrammeCapabilityRelationship[] = [
  { id: 'pcr-1', programmeId: 'prog-1', courseId: 'course-1', capabilityId: 'cap-1', outcomeId: 'outcome-1', intendedMaturity: 'Proficient' },
  { id: 'pcr-2', programmeId: 'prog-1', courseId: 'course-1', capabilityId: 'cap-2', outcomeId: 'outcome-1', intendedMaturity: 'Proficient' },
  { id: 'pcr-3', programmeId: 'prog-1', courseId: 'course-1', capabilityId: 'cap-4', outcomeId: 'outcome-1', intendedMaturity: 'Developing' },
  { id: 'pcr-4', programmeId: 'prog-1', courseId: 'course-2', capabilityId: 'cap-3', outcomeId: 'outcome-2', intendedMaturity: 'Developing' },
]

/**
 * Design-time assessment intent. "Data Analysis Project"/"Data Analysis
 * Midterm"/"ML Lab 6"/"Research Proposal" match real EvidenceRecord titles
 * in seed.ts on purpose, so evidence-produced counts are genuinely derived,
 * not asserted. "ML Foundations Diagnostic" deliberately has no matching
 * EvidenceRecord — course-1 intends cap-4 (matching claim-cap-4's real
 * Exposed/0-evidence state) but no assessment has produced Evidence for it
 * yet, a real, non-fabricated curriculum-alignment gap.
 */
export const assessmentEvidenceRequirements: AssessmentEvidenceRequirement[] = [
  { id: 'aer-1', courseId: 'course-1', assessmentTitle: 'Data Analysis Project', capabilityIds: ['cap-1'], description: 'Applied statistical analysis of a real dataset with justified test selection.' },
  { id: 'aer-2', courseId: 'course-1', assessmentTitle: 'Data Analysis Midterm', capabilityIds: ['cap-1'], description: 'Timed assessment of hypothesis-testing fundamentals.' },
  { id: 'aer-3', courseId: 'course-1', assessmentTitle: 'ML Lab 6', capabilityIds: ['cap-2'], description: 'Lab exercise building and validating a regression data model.' },
  { id: 'aer-4', courseId: 'course-1', assessmentTitle: 'ML Foundations Diagnostic', capabilityIds: ['cap-4'], description: 'Diagnostic exercise on supervised/unsupervised learning fundamentals — not yet run this term.' },
  { id: 'aer-5', courseId: 'course-2', assessmentTitle: 'Research Proposal', capabilityIds: ['cap-3'], description: 'A defensible research design with stated methodology and threats to validity addressed.' },
]

export const cohorts: Cohort[] = [
  { id: 'cohort-2026', programmeId: 'prog-1', name: 'BSc Computer Science — Cohort 2026', startYear: 2026, studentIds: ['student-1'] },
]

/**
 * Derived from the real Evidence/Capability state already in seed.ts (see
 * comments on each), not invented independently of it.
 */
export const curriculumAlignmentIssues: CurriculumAlignmentIssue[] = [
  {
    id: 'cai-1',
    programmeId: 'prog-1',
    outcomeId: 'outcome-1',
    capabilityId: 'cap-4',
    capabilityName: 'Machine Learning Foundations',
    breakType: 'assessment_without_sufficient_evidence',
    description: 'CS301 intends Machine Learning Foundations and an assessment (ML Foundations Diagnostic) is designed for it, but no Evidence has been produced yet this term — claim-cap-4 remains at Exposed with zero supporting Evidence.',
    affectedCourseIds: ['course-1'],
    affectedCohortIds: ['cohort-2026'],
  },
  {
    id: 'cai-2',
    programmeId: 'prog-1',
    outcomeId: 'outcome-1',
    capabilityId: 'cap-2',
    capabilityName: 'Data Modeling',
    breakType: 'reviewed_but_insufficient_confidence',
    description: 'CS301 intends Data Modeling at Proficient; observed Capability is Developing (Supported, 0.62) — one supporting submission (ML Lab 6) is still pending review and one (Early Regression Draft) was disputed pending clarification.',
    affectedCourseIds: ['course-1'],
    affectedCohortIds: ['cohort-2026'],
  },
  {
    id: 'cai-3',
    programmeId: 'prog-1',
    outcomeId: 'outcome-2',
    capabilityId: 'cap-3',
    capabilityName: 'Research Design',
    breakType: 'evidence_awaiting_review',
    description: 'CS410 intends Research Design at Developing; both the original Research Proposal and its revision are still awaiting Faculty review, so observed Capability remains at Emerging.',
    affectedCourseIds: ['course-2'],
    affectedCohortIds: ['cohort-2026'],
  },
]

/**
 * Seeded department interventions. Session-only demo persistence in
 * department-repository.ts allows creating more at runtime; these three
 * seed realistic starting state tied to the real gaps above.
 */
export const departmentInterventions: DepartmentIntervention[] = [
  {
    id: 'di-1',
    type: 'add_evidence_project',
    title: 'Add a machine-learning diagnostic project to CS301',
    rationale: 'CS301 intends Machine Learning Foundations but currently has no Evidence-producing assessment for it (see curriculum-alignment issue cai-1).',
    programmeId: 'prog-1',
    courseId: 'course-1',
    capabilityIds: ['cap-4'],
    cohortId: 'cohort-2026',
    ownerId: 'fac-1',
    ownerName: 'Dr. Maria Santos',
    status: 'planned',
    createdAt: '2026-07-12T00:00:00.000Z',
    expectedEffect: 'Projected to give CS301 students a route to produce verifiable Evidence for Machine Learning Foundations this term.',
    evidenceRequiredToEvaluate: 'At least one reviewed Evidence record linked to Machine Learning Foundations per enrolled student.',
    limitations: 'This demo dataset models a single enrolled student, so the projected effect cannot be evaluated at cohort scale yet.',
    reviewDate: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'di-2',
    type: 'increase_review_capacity',
    title: 'Add a second reviewer for CS410 research submissions',
    rationale: 'Two Research Design submissions (Research Proposal and its revision) have been awaiting review, contributing to the review backlog.',
    programmeId: 'prog-1',
    courseId: 'course-2',
    capabilityIds: ['cap-3'],
    cohortId: 'cohort-2026',
    ownerId: 'admin-2',
    ownerName: 'Priya Nair',
    status: 'active',
    createdAt: '2026-07-18T00:00:00.000Z',
    expectedEffect: 'Projected to reduce average review turnaround for CS410 submissions.',
    evidenceRequiredToEvaluate: 'Average review turnaround for CS410 Evidence measured over the next term.',
    limitations: 'Turnaround improvement cannot be confirmed until a second reviewer is actually assigned and has completed reviews.',
    reviewDate: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'di-3',
    type: 'refresh_stale_evidence',
    title: 'Request refreshed Evidence for Spreadsheet-Based Modeling',
    rationale: 'The Spreadsheet-Based Modeling claim decayed to Stale after 12 months without new Evidence.',
    programmeId: 'prog-1',
    capabilityIds: ['cap-5'],
    cohortId: 'cohort-2026',
    ownerId: 'fac-1',
    ownerName: 'Dr. Maria Santos',
    status: 'awaiting_evaluation',
    createdAt: '2026-07-20T00:00:00.000Z',
    expectedEffect: 'Projected to restore the Spreadsheet-Based Modeling claim to an active (non-stale) state if new Evidence is verified.',
    evidenceRequiredToEvaluate: 'A new, reviewed Evidence record supporting Spreadsheet-Based Modeling.',
    limitations: 'Whether the claim actually refreshes still depends on Faculty review, not on requesting it.',
    reviewDate: '2026-08-30T00:00:00.000Z',
  },
]
