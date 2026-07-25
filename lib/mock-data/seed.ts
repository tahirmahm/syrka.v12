import type {
  Institution,
  Department,
  Programme,
  Course,
  CapabilityDefinition,
  CapabilityClaim,
  CapabilityRelationEdge,
  EvidenceRecord,
  EvidenceReview,
  OdysseyPlan,
  Passport,
  CampusUser,
} from '@/lib/campus-types'

/**
 * Minimal, internally-coherent seed data proving the repository pattern.
 * One student (Alex Chen), one institution/department/programme, and a
 * capability/evidence/Odyssey/Passport dataset wide enough to demonstrate
 * every real product state (verified, pending, disputed, revoked, stale,
 * insufficient evidence, superseded evidence) without fabricating a
 * uniformly high-achieving profile.
 */

export const institution: Institution = {
  id: 'inst-1',
  name: 'Meridian University',
  country: 'United States',
  departments: ['dept-1'],
}

export const department: Department = {
  id: 'dept-1',
  institutionId: 'inst-1',
  name: 'Department of Computer Science',
  programmeIds: ['prog-1'],
}

export const programme: Programme = {
  id: 'prog-1',
  departmentId: 'dept-1',
  name: 'BSc Computer Science',
  degreeLevel: 'undergraduate',
  courseIds: ['course-1', 'course-2'],
}

export const courses: Course[] = [
  { id: 'course-1', programmeId: 'prog-1', code: 'CS301', title: 'Data Analysis', facultyIds: ['fac-1'], capabilityIds: ['cap-1', 'cap-2'] },
  { id: 'course-2', programmeId: 'prog-1', code: 'CS410', title: 'Advanced Research Methods', facultyIds: ['fac-1'], capabilityIds: ['cap-3'] },
]

export const capabilityDefinitions: CapabilityDefinition[] = [
  { id: 'cap-1', name: 'Statistical Reasoning', domain: 'Data Analysis', description: 'Applying statistical methods to draw valid conclusions from data.' },
  { id: 'cap-2', name: 'Data Modeling', domain: 'Data Analysis', description: 'Structuring and representing data for analysis and storage.' },
  { id: 'cap-3', name: 'Research Design', domain: 'Research Methods', description: 'Designing rigorous, well-controlled research studies.' },
  { id: 'cap-4', name: 'Machine Learning Foundations', domain: 'Data Analysis', description: 'Core concepts underlying supervised and unsupervised learning methods.' },
  { id: 'cap-5', name: 'Spreadsheet-Based Modeling', domain: 'Data Analysis', description: 'Building analytical models using spreadsheet tools.' },
  { id: 'cap-6', name: 'Introductory Programming', domain: 'Computer Science', description: 'Writing and reasoning about basic procedural programs.' },
]

export const capabilityClaims: CapabilityClaim[] = [
  {
    id: 'claim-cap-1',
    capabilityId: 'cap-1',
    subjectId: 'student-1',
    maturity: 'Proficient',
    confidence: { score: 0.76, band: 'Strong', model: 'confidence@1.0.0' },
    evidenceCount: 2,
    evidenceIds: ['ev-1', 'ev-4'],
    courseIds: ['course-1'],
    lastObservedAt: '2026-07-06T00:00:00.000Z',
    history: [
      { at: '2026-05-01T00:00:00.000Z', maturity: 'Developing', confidence: { score: 0.58, band: 'Emerging' }, cause: 'Initial evidence from Data Analysis coursework' },
      { at: '2026-07-06T00:00:00.000Z', maturity: 'Proficient', confidence: { score: 0.76, band: 'Strong' }, cause: 'Evidence verified: Data Analysis Project' },
    ],
  },
  {
    id: 'claim-cap-2',
    capabilityId: 'cap-2',
    subjectId: 'student-1',
    maturity: 'Developing',
    confidence: { score: 0.62, band: 'Supported', model: 'confidence@1.0.0' },
    evidenceCount: 2,
    evidenceIds: ['ev-2', 'ev-5'],
    courseIds: ['course-1'],
    lastObservedAt: '2026-06-20T00:00:00.000Z',
    history: [
      { at: '2026-06-20T00:00:00.000Z', maturity: 'Developing', confidence: { score: 0.62, band: 'Supported' }, cause: 'Evidence observed: ML Lab 6' },
    ],
  },
  {
    id: 'claim-cap-3',
    capabilityId: 'cap-3',
    subjectId: 'student-1',
    maturity: 'Emerging',
    confidence: { score: 0.45, band: 'Emerging', model: 'confidence@1.0.0' },
    evidenceCount: 2,
    evidenceIds: ['ev-3', 'ev-7'],
    courseIds: ['course-2'],
    lastObservedAt: '2026-07-08T00:00:00.000Z',
    history: [
      { at: '2026-07-08T00:00:00.000Z', maturity: 'Emerging', confidence: { score: 0.45, band: 'Emerging' }, cause: 'Evidence submitted: Research Proposal' },
    ],
  },
  {
    id: 'claim-cap-4',
    capabilityId: 'cap-4',
    subjectId: 'student-1',
    maturity: 'Exposed',
    confidence: { score: 0.15, band: 'Unsupported', model: 'confidence@1.0.0' },
    evidenceCount: 0,
    evidenceIds: [],
    courseIds: [],
    lastObservedAt: '2026-06-01T00:00:00.000Z',
    history: [
      { at: '2026-06-01T00:00:00.000Z', maturity: 'Exposed', confidence: { score: 0.15, band: 'Unsupported' }, cause: 'Referenced in CS301 lecture materials; no performance evidence yet' },
    ],
  },
  {
    id: 'claim-cap-5',
    capabilityId: 'cap-5',
    subjectId: 'student-1',
    maturity: 'Stale',
    confidence: { score: 0.65, band: 'Supported', model: 'confidence@1.0.0' },
    evidenceCount: 1,
    evidenceIds: ['ev-9'],
    courseIds: [],
    lastObservedAt: '2025-02-14T00:00:00.000Z',
    history: [
      { at: '2025-02-14T00:00:00.000Z', maturity: 'Proficient', confidence: { score: 0.71, band: 'Strong' }, cause: 'Evidence verified: Spreadsheet Modeling Workshop' },
      { at: '2026-02-14T00:00:00.000Z', maturity: 'Stale', confidence: { score: 0.65, band: 'Supported' }, cause: 'Confidence decayed after 12 months without new evidence' },
    ],
  },
  {
    id: 'claim-cap-6',
    capabilityId: 'cap-6',
    subjectId: 'student-1',
    maturity: 'Revoked',
    confidence: { score: 0.1, band: 'Unsupported', model: 'confidence@1.0.0' },
    evidenceCount: 0,
    evidenceIds: [],
    courseIds: [],
    lastObservedAt: '2026-03-02T00:00:00.000Z',
    history: [
      { at: '2025-09-01T00:00:00.000Z', maturity: 'Developing', confidence: { score: 0.55, band: 'Emerging' }, cause: 'Evidence observed: Intro to Programming Certificate' },
      { at: '2026-03-02T00:00:00.000Z', maturity: 'Revoked', confidence: { score: 0.1, band: 'Unsupported' }, cause: 'Sole supporting evidence revoked: issuing body could not be verified' },
    ],
  },
]

export const capabilityRelationEdges: CapabilityRelationEdge[] = [
  { id: 'edge-1', type: 'REQUIRES', fromCapabilityId: 'cap-4', toCapabilityId: 'cap-1', confidence: { score: 0.82, band: 'Strong' } },
  { id: 'edge-2', type: 'REQUIRES', fromCapabilityId: 'cap-4', toCapabilityId: 'cap-2', confidence: { score: 0.78, band: 'Strong' } },
  { id: 'edge-3', type: 'DEPENDS_ON', fromCapabilityId: 'cap-3', toCapabilityId: 'cap-1', confidence: { score: 0.6, band: 'Supported' } },
  { id: 'edge-4', type: 'DEPENDS_ON', fromCapabilityId: 'cap-5', toCapabilityId: 'cap-2', confidence: { score: 0.55, band: 'Supported' } },
]

export const evidenceRecords: EvidenceRecord[] = [
  { id: 'ev-1', title: 'Data Analysis Project', sourceType: 'project', studentId: 'student-1', courseId: 'course-1', capabilityIds: ['cap-1'], submittedAt: '2026-07-01T00:00:00.000Z', provenance: 'Submitted via CS301 course project pipeline.' },
  { id: 'ev-2', title: 'ML Lab 6', sourceType: 'assignment', studentId: 'student-1', courseId: 'course-1', capabilityIds: ['cap-2'], submittedAt: '2026-07-06T00:00:00.000Z', provenance: 'Submitted via CS301 lab assignment pipeline.' },
  { id: 'ev-3', title: 'Research Proposal', sourceType: 'assignment', studentId: 'student-1', courseId: 'course-2', capabilityIds: ['cap-3'], submittedAt: '2026-07-08T00:00:00.000Z', provenance: 'Submitted via CS410 course assignment pipeline.' },
  { id: 'ev-4', title: 'Data Analysis Midterm', sourceType: 'assessment', studentId: 'student-1', courseId: 'course-1', capabilityIds: ['cap-1'], submittedAt: '2026-06-15T00:00:00.000Z', provenance: 'Recorded via CS301 assessment pipeline.' },
  { id: 'ev-5', title: 'Early Regression Draft', sourceType: 'project', studentId: 'student-1', courseId: 'course-1', capabilityIds: ['cap-2'], submittedAt: '2026-06-25T00:00:00.000Z', provenance: 'Submitted via CS301 course project pipeline.' },
  { id: 'ev-6', title: 'Legacy Statistics Certificate', sourceType: 'external_credential', studentId: 'student-1', capabilityIds: ['cap-1'], submittedAt: '2025-01-10T00:00:00.000Z', provenance: 'Self-reported external credential upload.' },
  { id: 'ev-7', title: 'Research Proposal (Revised)', sourceType: 'assignment', studentId: 'student-1', courseId: 'course-2', capabilityIds: ['cap-3'], submittedAt: '2026-07-15T00:00:00.000Z', provenance: 'Submitted via CS410 course assignment pipeline.', supersedesEvidenceId: 'ev-3' },
  { id: 'ev-8', title: 'Intro to Programming Certificate', sourceType: 'external_credential', studentId: 'student-1', capabilityIds: ['cap-6'], submittedAt: '2025-08-20T00:00:00.000Z', provenance: 'Self-reported external credential upload.' },
  { id: 'ev-9', title: 'Spreadsheet Modeling Workshop', sourceType: 'project', studentId: 'student-1', capabilityIds: ['cap-5'], submittedAt: '2025-02-10T00:00:00.000Z', provenance: 'Faculty-run workshop artifact submission.' },
]

export const evidenceReviews: EvidenceReview[] = [
  { id: 'rev-1', evidenceId: 'ev-1', status: 'verified', reviewedAt: '2026-07-06T00:00:00.000Z', reviewedBy: 'fac-1', rationale: 'Strong methodology, correct statistical tests applied.' },
  { id: 'rev-2', evidenceId: 'ev-2', status: 'pending' },
  { id: 'rev-3', evidenceId: 'ev-3', status: 'pending' },
  { id: 'rev-4', evidenceId: 'ev-4', status: 'verified', reviewedAt: '2026-06-18T00:00:00.000Z', reviewedBy: 'fac-1', rationale: 'Correct application of hypothesis testing across all sections.' },
  { id: 'rev-5', evidenceId: 'ev-5', status: 'disputed', reviewedAt: '2026-06-28T00:00:00.000Z', reviewedBy: 'fac-1', rationale: 'Methodology unclear — please clarify variable selection before this can support the claim.' },
  { id: 'rev-6', evidenceId: 'ev-6', status: 'revoked', reviewedAt: '2025-02-01T00:00:00.000Z', reviewedBy: 'fac-1', rationale: 'Issuing body could not be verified.' },
  { id: 'rev-7', evidenceId: 'ev-7', status: 'pending' },
  { id: 'rev-8', evidenceId: 'ev-8', status: 'revoked', reviewedAt: '2026-03-02T00:00:00.000Z', reviewedBy: 'fac-1', rationale: 'Issuing body could not be verified.' },
  { id: 'rev-9', evidenceId: 'ev-9', status: 'verified', reviewedAt: '2025-02-14T00:00:00.000Z', reviewedBy: 'fac-1', rationale: 'Workshop artifact demonstrates correct spreadsheet-based model structure.' },
]

export const odysseyPlan: OdysseyPlan = {
  id: 'odyssey-1',
  studentId: 'student-1',
  targetOutcome: 'Data Scientist',
  currentPositionSummary: 'Proficient in statistical reasoning; developing data modeling; early research design evidence.',
  milestones: [
    { id: 'ms-1', title: 'Complete CS301 Data Analysis', description: 'Foundational statistical reasoning and data modeling evidence.', status: 'completed', requiredEvidenceIds: ['ev-1'], requiredCapabilityIds: ['cap-1'] },
    { id: 'ms-2', title: 'Advance Data Modeling to Proficient', description: 'Additional verified evidence across varied contexts.', status: 'current', requiredEvidenceIds: ['ev-2'], requiredCapabilityIds: ['cap-2'] },
    { id: 'ms-3', title: 'Complete CS410 Research Methods', description: 'Verified research design capability for graduate-level readiness.', status: 'upcoming', requiredEvidenceIds: ['ev-3'], requiredCapabilityIds: ['cap-3'] },
  ],
  recommendations: [
    {
      id: 'rec-1',
      title: 'Enroll in Applied Machine Learning',
      reason: 'Builds directly on your Proficient statistical reasoning and Developing data modeling capabilities.',
      confidence: { score: 0.81, band: 'Strong' },
      evidenceIds: ['ev-1', 'ev-2'],
      capabilityId: 'cap-2',
    },
  ],
  alternatives: ['Data Analyst track (less research emphasis)', 'ML Engineering track (more systems emphasis)'],
}

export const passport: Passport = {
  id: 'passport-1',
  studentId: 'student-1',
  institutionId: 'inst-1',
  programmeId: 'prog-1',
  currentVersion: 3,
  versions: [
    {
      version: 3,
      issuedAt: '2026-07-10T00:00:00.000Z',
      claims: [
        { id: 'claim-1', capabilityId: 'cap-1', capabilityName: 'Statistical Reasoning', maturity: 'Proficient', confidence: { score: 0.76, band: 'Strong' }, evidenceIds: ['ev-1'], status: 'active', issuedAt: '2026-07-10T00:00:00.000Z' },
      ],
    },
  ],
  verificationSeal: { issuer: 'Meridian University', verifiedAt: '2026-07-10T00:00:00.000Z' },
  sharing: { shareableLinkEnabled: false, redactedFields: [] },
}

export const currentUser: CampusUser = {
  id: 'student-1',
  name: 'Alex Chen',
  role: 'student',
  institutionId: 'inst-1',
  programmeId: 'prog-1',
}

export const facultyUser: CampusUser = {
  id: 'fac-1',
  name: 'Dr. Maria Santos',
  role: 'faculty',
  institutionId: 'inst-1',
  departmentId: 'dept-1',
}

export const universityAdministratorUser: CampusUser = {
  id: 'admin-1',
  name: 'Jordan Reyes',
  role: 'university_administrator',
  institutionId: 'inst-1',
  administratorScope: { level: 'institution', institutionId: 'inst-1' },
}

export const departmentAdministratorUser: CampusUser = {
  id: 'admin-2',
  name: 'Priya Nair',
  role: 'university_administrator',
  institutionId: 'inst-1',
  administratorScope: { level: 'department', institutionId: 'inst-1', departmentId: 'dept-1' },
}
