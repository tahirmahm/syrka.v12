import type { GovernancePolicy, GovernanceProposal, InstitutionalIntervention } from '@/lib/campus-types'

/**
 * University-only institutional facts that can't be derived from
 * Department/Programme/Course/Capability/Evidence data — governance policy
 * state and seeded institutional interventions. Everything else the
 * University routes need (department/programme rollups, capability
 * strategy, evidence governance, faculty capacity, cohort intelligence) is
 * computed by university-repository.ts from this plus the existing
 * Department repository and Evidence/Capability/Odyssey/Passport seed,
 * never hardcoded here as a fabricated statistic.
 */

export const governancePolicies: GovernancePolicy[] = [
  { id: 'gov-1', area: 'capability_taxonomy', title: 'Capability taxonomy governance', description: 'Capability definitions are institution-owned; departments propose additions, the institution approves them.', state: 'active_policy', lastReviewedAt: '2026-01-15T00:00:00.000Z' },
  { id: 'gov-2', area: 'programme_capability_mapping', title: 'Programme-to-Capability mapping', description: 'Departments declare programme outcomes and course-capability relationships; the institution audits coverage.', state: 'active_policy', lastReviewedAt: '2026-01-15T00:00:00.000Z' },
  { id: 'gov-3', area: 'evidence_standards', title: 'Evidence standards', description: 'Evidence must be attributable, timestamped, and traceable to its source pipeline before it can support a Capability claim.', state: 'active_policy', lastReviewedAt: '2025-11-01T00:00:00.000Z' },
  { id: 'gov-4', area: 'review_criteria', title: 'Review criteria', description: 'Each course publishes its Evidence-review rubric per Capability before the term begins.', state: 'active_policy' },
  { id: 'gov-5', area: 'review_calibration', title: 'Review calibration', description: 'Cross-reviewer calibration is recommended once a department has more than one reviewer per course; not yet institutionally mandated.', state: 'proposed_policy' },
  { id: 'gov-6', area: 'evidence_provenance', title: 'Evidence provenance', description: 'External credentials require independent verification before they can support a Capability claim.', state: 'active_policy' },
  { id: 'gov-7', area: 'passport_issuance', title: 'Passport issuance policy', description: 'A Capability claim becomes Passport-eligible only once it is reviewed and clears the Strong confidence threshold.', state: 'active_policy' },
  { id: 'gov-8', area: 'disclosure_policy', title: 'Disclosure policy', description: 'Students, not the institution, configure what an external Passport view discloses.', state: 'active_policy' },
  { id: 'gov-9', area: 'odyssey_recommendation_authority', title: 'Odyssey recommendation authority', description: 'AI-generated Odyssey recommendations are advisory; no milestone is marked verified without reviewed Evidence.', state: 'active_policy' },
  { id: 'gov-10', area: 'ai_authority_boundaries', title: 'AI authority boundaries', description: 'DeepSeek may draft and summarise; it may never approve Evidence, assign Capability truth, or issue Passport claims.', state: 'active_policy' },
  { id: 'gov-11', area: 'data_access_purpose', title: 'Data-access purpose limitation', description: 'Department and University Administration access individual student detail only for a stated academic or governance purpose.', state: 'active_policy' },
  { id: 'gov-12', area: 'role_boundaries', title: 'Role boundaries', description: 'University Administration is University Administration scoped to an institution — not a distinct persona from Department Administration.', state: 'active_policy' },
  { id: 'gov-13', area: 'versioning', title: 'Capability and Passport versioning', description: 'Capability history and Passport versions are never overwritten — every change is additive and inspectable.', state: 'active_policy' },
  { id: 'gov-14', area: 'passport_issuance', title: 'Automated re-issuance on evidence refresh', description: 'Automatically reissuing a Passport version the moment new Evidence is verified, rather than on a review cycle.', state: 'demo_configuration' },
  { id: 'gov-15', area: 'review_calibration', title: 'Institution-wide calibration dashboard', description: 'A live cross-department calibration dashboard requires a backend review-analytics pipeline not yet built.', state: 'requires_backend_integration' },
]

export const governanceProposals: GovernanceProposal[] = [
  {
    id: 'gov-prop-1',
    area: 'review_calibration',
    title: 'Mandate calibration once a department has 2+ reviewers per course',
    rationale: 'Currently only recommended; as departments grow past one reviewer per course, inconsistent review practice becomes a real risk.',
    proposedBy: 'Jordan Reyes',
    proposedAt: '2026-07-01T00:00:00.000Z',
    status: 'under_review',
  },
]

export const institutionalInterventions: InstitutionalIntervention[] = [
  {
    id: 'ii-1',
    type: 'evidence_provenance_audit',
    title: 'Audit external-credential provenance across the institution',
    rationale: 'Two external-credential Evidence records in the Department of Computer Science were revoked after failing provenance verification (see gov-6).',
    affectedDepartmentIds: ['dept-1'],
    affectedProgrammeIds: ['prog-1'],
    affectedCapabilityIds: ['cap-1', 'cap-6'],
    affectedCohortIds: ['cohort-2026'],
    ownerId: 'admin-1',
    ownerName: 'Jordan Reyes',
    status: 'active',
    createdAt: '2026-07-10T00:00:00.000Z',
    reviewDate: '2026-09-01T00:00:00.000Z',
    expectedEffect: 'Projected to reduce the rate of unverifiable external credentials accepted as Evidence institution-wide.',
    evidenceRequiredToEvaluate: 'A reduction in provenance-concern-flagged Evidence records in the next review cycle.',
    limitations: 'This demo institution models a single department, so institution-wide prevalence cannot yet be measured across departments.',
  },
  {
    id: 'ii-2',
    type: 'central_review_capacity_programme',
    title: 'Establish a central review-capacity pool for ageing submissions',
    rationale: 'Review backlog and turnaround delays observed in the Department of Computer Science point to a broader capacity constraint worth addressing institutionally rather than department-by-department.',
    affectedDepartmentIds: ['dept-1'],
    affectedProgrammeIds: [],
    affectedCapabilityIds: [],
    affectedCohortIds: [],
    ownerId: 'admin-1',
    ownerName: 'Jordan Reyes',
    status: 'planned',
    createdAt: '2026-07-20T00:00:00.000Z',
    reviewDate: '2026-10-15T00:00:00.000Z',
    expectedEffect: 'Projected to reduce average institutional review turnaround.',
    evidenceRequiredToEvaluate: 'Average turnaround-days measured across departments after the pool is staffed.',
    limitations: 'Requires departments to actually route submissions to the pool; creating it does not itself change turnaround.',
  },
]
