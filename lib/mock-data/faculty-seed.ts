import type { FacultyProfile, FacultyCourseAssignment, ReviewCriteria, FacultyReviewDecision } from '@/lib/campus-types'

/**
 * Institutional facts that cannot be derived from Evidence/Capability data
 * (who teaches what, what a course's rubric intends, decisions already
 * made). Everything else Faculty routes need — coverage counts, workload,
 * analytics, queue entries, impact previews — is computed by
 * faculty-repository.ts from this plus the existing Evidence/Capability
 * seed, never hardcoded here as a fabricated statistic.
 */

export const facultyProfile: FacultyProfile = {
  id: 'fac-1',
  name: 'Dr. Maria Santos',
  title: 'Associate Professor',
  departmentId: 'dept-1',
  institutionId: 'inst-1',
}

export const facultyCourseAssignments: FacultyCourseAssignment[] = [
  { id: 'fca-1', facultyId: 'fac-1', courseId: 'course-1', role: 'instructor', term: '2026 Spring' },
  { id: 'fca-2', facultyId: 'fac-1', courseId: 'course-2', role: 'instructor', term: '2026 Spring' },
]

export const reviewCriteria: ReviewCriteria[] = [
  {
    id: 'rc-1',
    courseId: 'course-1',
    capabilityId: 'cap-1',
    description: 'Correct application of statistical tests with justified assumptions.',
    expectedMaturity: 'Proficient',
  },
  {
    id: 'rc-2',
    courseId: 'course-1',
    capabilityId: 'cap-2',
    description: 'Data models are structured appropriately for the analysis question, with validation.',
    expectedMaturity: 'Proficient',
  },
  {
    id: 'rc-3',
    courseId: 'course-2',
    capabilityId: 'cap-3',
    description: 'Research design is well-controlled, with a clearly stated methodology and threats to validity addressed.',
    expectedMaturity: 'Developing',
  },
]

/**
 * Matches the already-reviewed EvidenceReview records in lib/mock-data/seed.ts
 * (rev-1, rev-4, rev-5, rev-6, rev-8, rev-9) so review history is coherent
 * with the existing Evidence timeline. rev-2/rev-3/rev-7 are still pending —
 * deliberately no decision recorded for them, so they populate the review queue.
 */
export const facultyReviewDecisions: FacultyReviewDecision[] = [
  {
    id: 'frd-1',
    evidenceId: 'ev-1',
    decisionType: 'approve',
    rationale: 'Strong methodology, correct statistical tests applied.',
    limitations: [],
    supportedCapabilityIds: ['cap-1'],
    unsupportedCapabilityIds: [],
    decidedBy: 'fac-1',
    decidedAt: '2026-07-06T00:00:00.000Z',
  },
  {
    id: 'frd-2',
    evidenceId: 'ev-4',
    decisionType: 'approve',
    rationale: 'Correct application of hypothesis testing across all sections.',
    limitations: [],
    supportedCapabilityIds: ['cap-1'],
    unsupportedCapabilityIds: [],
    decidedBy: 'fac-1',
    decidedAt: '2026-06-18T00:00:00.000Z',
  },
  {
    id: 'frd-3',
    evidenceId: 'ev-5',
    decisionType: 'request_revision',
    rationale: 'Methodology unclear — please clarify variable selection before this can support the claim.',
    limitations: ['insufficient_detail'],
    supportedCapabilityIds: [],
    unsupportedCapabilityIds: ['cap-2'],
    decidedBy: 'fac-1',
    decidedAt: '2026-06-28T00:00:00.000Z',
  },
  {
    id: 'frd-4',
    evidenceId: 'ev-6',
    decisionType: 'revoke',
    rationale: 'Issuing body could not be verified.',
    limitations: [],
    supportedCapabilityIds: [],
    unsupportedCapabilityIds: ['cap-1'],
    provenanceConcern: 'unverifiable_source',
    decidedBy: 'fac-1',
    decidedAt: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 'frd-5',
    evidenceId: 'ev-8',
    decisionType: 'revoke',
    rationale: 'Issuing body could not be verified.',
    limitations: [],
    supportedCapabilityIds: [],
    unsupportedCapabilityIds: ['cap-6'],
    provenanceConcern: 'unverifiable_source',
    decidedBy: 'fac-1',
    decidedAt: '2026-03-02T00:00:00.000Z',
  },
  {
    id: 'frd-6',
    evidenceId: 'ev-9',
    decisionType: 'approve',
    rationale: 'Workshop artifact demonstrates correct spreadsheet-based model structure.',
    limitations: ['single_context'],
    supportedCapabilityIds: ['cap-5'],
    unsupportedCapabilityIds: [],
    decidedBy: 'fac-1',
    decidedAt: '2025-02-14T00:00:00.000Z',
  },
]
