import type {
  Institution,
  Department,
  Programme,
  Course,
  CapabilityDefinition,
  CapabilityState,
  EvidenceItem,
  OdysseyPlan,
  Passport,
  CampusUser,
} from '@/lib/campus-types'

/**
 * Minimal, internally-coherent seed data proving the repository pattern.
 * One student (Alex Chen), one institution/department/programme, a handful
 * of capabilities/evidence/odyssey milestones/passport claims that all
 * reference the same ids consistently. Expanded per-screen in later phases.
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
]

export const capabilityStates: CapabilityState[] = [
  {
    id: 'capstate-1',
    capabilityId: 'cap-1',
    subjectId: 'student-1',
    maturity: 'Proficient',
    confidence: { score: 0.76, band: 'Strong', model: 'confidence@1.0.0' },
    evidenceCount: 4,
    courseIds: ['course-1'],
    lastObservedAt: '2026-07-06T00:00:00.000Z',
    history: [
      { at: '2026-05-01T00:00:00.000Z', maturity: 'Developing', confidence: { score: 0.58, band: 'Emerging' }, cause: 'Initial evidence from Data Analysis coursework' },
      { at: '2026-07-06T00:00:00.000Z', maturity: 'Proficient', confidence: { score: 0.76, band: 'Strong' }, cause: 'Evidence verified: Data Analysis Project' },
    ],
  },
  {
    id: 'capstate-2',
    capabilityId: 'cap-2',
    subjectId: 'student-1',
    maturity: 'Developing',
    confidence: { score: 0.62, band: 'Supported', model: 'confidence@1.0.0' },
    evidenceCount: 2,
    courseIds: ['course-1'],
    lastObservedAt: '2026-06-20T00:00:00.000Z',
    history: [
      { at: '2026-06-20T00:00:00.000Z', maturity: 'Developing', confidence: { score: 0.62, band: 'Supported' }, cause: 'Evidence observed: ML Lab 6' },
    ],
  },
  {
    id: 'capstate-3',
    capabilityId: 'cap-3',
    subjectId: 'student-1',
    maturity: 'Emerging',
    confidence: { score: 0.45, band: 'Emerging', model: 'confidence@1.0.0' },
    evidenceCount: 1,
    courseIds: ['course-2'],
    lastObservedAt: '2026-07-08T00:00:00.000Z',
    history: [
      { at: '2026-07-08T00:00:00.000Z', maturity: 'Emerging', confidence: { score: 0.45, band: 'Emerging' }, cause: 'Evidence submitted: Research Proposal' },
    ],
  },
]

export const evidenceItems: EvidenceItem[] = [
  {
    id: 'ev-1',
    title: 'Data Analysis Project',
    sourceType: 'project',
    status: 'verified',
    studentId: 'student-1',
    courseId: 'course-1',
    capabilityIds: ['cap-1'],
    submittedAt: '2026-07-01T00:00:00.000Z',
    reviewedAt: '2026-07-06T00:00:00.000Z',
    reviewedBy: 'fac-1',
    reviewerNote: 'Strong methodology, correct statistical tests applied.',
    provenance: 'Submitted via CS301 course project pipeline.',
  },
  {
    id: 'ev-2',
    title: 'ML Lab 6',
    sourceType: 'assignment',
    status: 'pending',
    studentId: 'student-1',
    courseId: 'course-1',
    capabilityIds: ['cap-2'],
    submittedAt: '2026-07-06T00:00:00.000Z',
    provenance: 'Submitted via CS301 lab assignment pipeline.',
  },
  {
    id: 'ev-3',
    title: 'Research Proposal',
    sourceType: 'assignment',
    status: 'pending',
    studentId: 'student-1',
    courseId: 'course-2',
    capabilityIds: ['cap-3'],
    submittedAt: '2026-07-08T00:00:00.000Z',
    provenance: 'Submitted via CS410 course assignment pipeline.',
  },
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
