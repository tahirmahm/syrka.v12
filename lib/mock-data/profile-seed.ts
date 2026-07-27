import type {
  ExternalConnection,
  SourceAccount,
  SourceRefresh,
  SourceRecord,
  ImportedAssertion,
  EvidenceCandidate,
  ProvenanceRecord,
  CapabilityInferenceBasis,
  CapabilityInference,
  IdentityResolution,
  ConflictRecord,
  DuplicateResolution,
  UserConfirmation,
  ReviewRequirement,
  DisclosurePermission,
  PassportProjectionRule,
  PortfolioProfile,
  PortfolioAudience,
  PortfolioPublication,
  PortfolioSlug,
} from '@/lib/campus-types'
import { computeInferenceConfidence } from '@/lib/services/profile/inference'
import { evaluatePassportEligibility } from '@/lib/services/profile/passport-eligibility'
import { validateProfileData } from '@/lib/validation/validate-profile-data'
import { evidenceRecords as nativeEvidenceRecords } from '@/lib/mock-data/seed'

/** Fixed instant everything below evaluates "as of" — never Date.now(), so evaluation is reproducible. */
export const PROFILE_NOW = '2026-07-20T00:00:00.000Z'
const STUDENT_ID = 'student-1'

// ---------------------------------------------------------------------------
// Connections / accounts / refreshes (github, scholar, linkedin, discord —
// cv/user_entered/campus_learning/odyssey are native or direct-upload and
// never appear as an ExternalConnection).
// ---------------------------------------------------------------------------

export const sourceAccounts: SourceAccount[] = [
  { id: 'pf-acct-github', sourceCategory: 'github', externalIdentifier: 'alexchen-dev', displayLabel: 'github.com/alexchen-dev' },
  { id: 'pf-acct-scholar', sourceCategory: 'google_scholar', externalIdentifier: 'scholar-author-8842', displayLabel: 'A Chen — Meridian University' },
  { id: 'pf-acct-linkedin', sourceCategory: 'linkedin', externalIdentifier: 'linkedin.com/in/alex-chen-example', displayLabel: 'Alex Chen' },
  { id: 'pf-acct-discord', sourceCategory: 'discord', externalIdentifier: 'alexc#0142', displayLabel: 'Meridian CS Discord' },
]

export const externalConnections: ExternalConnection[] = [
  { id: 'pf-conn-github', studentId: STUDENT_ID, sourceCategory: 'github', sourceAccountId: 'pf-acct-github', state: 'connected', scopeGranted: ['read:user', 'repo:read'], connectedAt: '2026-05-01T00:00:00.000Z', lastRefreshedAt: '2026-07-15T00:00:00.000Z' },
  { id: 'pf-conn-scholar', studentId: STUDENT_ID, sourceCategory: 'google_scholar', sourceAccountId: 'pf-acct-scholar', state: 'connected', scopeGranted: [], connectedAt: '2026-05-10T00:00:00.000Z', lastRefreshedAt: '2026-07-10T00:00:00.000Z' },
  { id: 'pf-conn-linkedin', studentId: STUDENT_ID, sourceCategory: 'linkedin', sourceAccountId: 'pf-acct-linkedin', state: 'connected', scopeGranted: ['profile-export'], connectedAt: '2026-04-01T00:00:00.000Z', lastRefreshedAt: '2026-04-01T00:00:00.000Z' },
  { id: 'pf-conn-discord', studentId: STUDENT_ID, sourceCategory: 'discord', sourceAccountId: 'pf-acct-discord', state: 'connected', scopeGranted: ['identify', 'guilds'], connectedAt: '2026-06-01T00:00:00.000Z', lastRefreshedAt: '2026-06-01T00:00:00.000Z' },
]

export const sourceRefreshes: SourceRefresh[] = [
  { id: 'pf-refresh-github-1', connectionId: 'pf-conn-github', occurredAt: '2026-07-15T00:00:00.000Z', status: 'success', recordsAdded: 3, recordsUpdated: 1, recordsRemoved: 0, recordsExcluded: 2 },
  { id: 'pf-refresh-scholar-1', connectionId: 'pf-conn-scholar', occurredAt: '2026-07-10T00:00:00.000Z', status: 'success', recordsAdded: 1, recordsUpdated: 0, recordsRemoved: 0, recordsExcluded: 0 },
  { id: 'pf-refresh-linkedin-1', connectionId: 'pf-conn-linkedin', occurredAt: '2026-04-01T00:00:00.000Z', status: 'success', recordsAdded: 2, recordsUpdated: 0, recordsRemoved: 0, recordsExcluded: 0 },
  { id: 'pf-refresh-discord-1', connectionId: 'pf-conn-discord', occurredAt: '2026-06-01T00:00:00.000Z', status: 'success', recordsAdded: 1, recordsUpdated: 0, recordsRemoved: 0, recordsExcluded: 0 },
]

// ---------------------------------------------------------------------------
// Source records + imported assertions
// ---------------------------------------------------------------------------

export const sourceRecords: SourceRecord[] = [
  { id: 'pf-src-cv-employment', sourceCategory: 'cv', externalRecordId: 'cv-line-3', capturedAt: '2026-05-02T00:00:00.000Z', raw: { role: 'Software Engineering Intern', org: 'Meridian Labs', start: '2025-06-01', end: '2025-08-31' } },
  { id: 'pf-src-linkedin-employment', sourceCategory: 'linkedin', externalRecordId: 'li-position-2', capturedAt: '2026-04-01T00:00:00.000Z', raw: { role: 'Software Engineering Intern', org: 'Meridian Labs', start: '2025-06-01', end: '2025-09-05' } },
  { id: 'pf-src-github-repo', sourceCategory: 'github', externalRecordId: 'alexchen-dev/data-analysis-toolkit', capturedAt: '2026-07-15T00:00:00.000Z', raw: { repo: 'data-analysis-toolkit', mergedPRs: 6, reviewedPRs: 4, hasDocs: true, hasTests: true } },
  { id: 'pf-src-scholar-pub', sourceCategory: 'google_scholar', externalRecordId: 'scholar-pub-1', capturedAt: '2026-07-10T00:00:00.000Z', raw: { title: 'Observed regression stability under small-sample resampling', venue: 'Undergraduate Research Symposium', year: 2026 } },
  { id: 'pf-src-discord-signal', sourceCategory: 'discord', externalRecordId: 'discord-thread-55', capturedAt: '2026-06-01T00:00:00.000Z', raw: { channel: '#cs301-help', kind: 'sustained-technical-assistance', threadCount: 11 } },
]

export const importedAssertions: ImportedAssertion[] = [
  // Scenario: CV + LinkedIn duplicate — NOT independent corroboration.
  { id: 'pf-assert-cv-employment', studentId: STUDENT_ID, sourceRecordId: 'pf-src-cv-employment', kind: 'employment', label: 'Software Engineering Intern, Meridian Labs', startDate: '2025-06-01', endDate: '2025-08-31', provenanceId: 'pf-prov-cv-employment' },
  { id: 'pf-assert-linkedin-employment', studentId: STUDENT_ID, sourceRecordId: 'pf-src-linkedin-employment', kind: 'employment', label: 'Software Engineering Intern, Meridian Labs', startDate: '2025-06-01', endDate: '2025-09-05', provenanceId: 'pf-prov-linkedin-employment' },
  // Scenario: GitHub repo linked to existing native Evidence.
  { id: 'pf-assert-github-contribution', studentId: STUDENT_ID, sourceRecordId: 'pf-src-github-repo', kind: 'contribution', label: 'data-analysis-toolkit — sustained, reviewed contribution', description: '6 merged PRs, 4 with review, tests and documentation present.', provenanceId: 'pf-prov-github-contribution' },
  // Scenario: Scholar publication awaiting identity confirmation.
  { id: 'pf-assert-scholar-pub', studentId: STUDENT_ID, sourceRecordId: 'pf-src-scholar-pub', kind: 'publication', label: 'Observed regression stability under small-sample resampling', provenanceId: 'pf-prov-scholar-pub' },
  // Scenario: Discord contextual signal — remains low authority.
  { id: 'pf-assert-discord-signal', studentId: STUDENT_ID, sourceRecordId: 'pf-src-discord-signal', kind: 'community_activity', label: 'Sustained technical assistance in #cs301-help', description: 'Not corroborated by any tangible artefact — contextual only.', provenanceId: 'pf-prov-discord-signal' },
]

// ---------------------------------------------------------------------------
// Provenance — authority is never upgraded by mere repetition (§5): the
// LinkedIn employment entry lists the CV entry as a corroborating source,
// but independent:false, so it stays user_asserted, never externally_verified.
// ---------------------------------------------------------------------------

export const provenanceRecords: ProvenanceRecord[] = [
  {
    id: 'pf-prov-cv-employment', source: 'cv', sourceIdentifier: 'cv-line-3', owner: STUDENT_ID, importMethod: 'document_upload',
    importedAt: '2026-05-02T00:00:00.000Z', authorityClass: 'user_asserted', derivationType: 'imported', corroboratingSources: [], linkedArtefactIds: [], disclosurePermissionIds: ['pf-disclose-cv-employment-passport'],
  },
  {
    id: 'pf-prov-linkedin-employment', source: 'linkedin', sourceIdentifier: 'li-position-2', owner: STUDENT_ID, importMethod: 'user_authorised_export',
    importedAt: '2026-04-01T00:00:00.000Z', authorityClass: 'user_asserted', derivationType: 'imported',
    corroboratingSources: [{ sourceRecordId: 'pf-src-cv-employment', sourceCategory: 'cv', independent: false }],
    linkedArtefactIds: [], limitations: 'Same student self-reported this employment on both CV and LinkedIn — not independent corroboration.', disclosurePermissionIds: [],
  },
  {
    id: 'pf-prov-github-contribution', source: 'github', sourceIdentifier: 'alexchen-dev/data-analysis-toolkit', owner: STUDENT_ID, importMethod: 'oauth_api',
    importedAt: '2026-07-15T00:00:00.000Z', lastRefreshedAt: '2026-07-15T00:00:00.000Z', originalUrl: 'https://github.com/alexchen-dev/data-analysis-toolkit',
    authorityClass: 'platform_grounded', derivationType: 'directly_observed', corroboratingSources: [], linkedArtefactIds: ['ev-1'], disclosurePermissionIds: ['pf-disclose-github-portfolio-public', 'pf-disclose-github-passport'],
  },
  {
    id: 'pf-prov-scholar-pub', source: 'google_scholar', sourceIdentifier: 'scholar-pub-1', owner: STUDENT_ID, importMethod: 'oauth_api',
    importedAt: '2026-07-10T00:00:00.000Z', authorityClass: 'unresolved', derivationType: 'directly_observed', corroboratingSources: [],
    userConfirmationId: undefined, linkedArtefactIds: [], limitations: 'Author identity not yet confirmed — shared name risk on Scholar.', disclosurePermissionIds: [],
  },
  {
    id: 'pf-prov-discord-signal', source: 'discord', sourceIdentifier: 'discord-thread-55', owner: STUDENT_ID, importMethod: 'oauth_api',
    importedAt: '2026-06-01T00:00:00.000Z', authorityClass: 'user_asserted', derivationType: 'directly_observed', corroboratingSources: [],
    linkedArtefactIds: [], limitations: 'Contextual signal only — not corroborated by a tangible artefact; never load-bearing on its own.', disclosurePermissionIds: [],
  },
]

// ---------------------------------------------------------------------------
// Evidence candidates — the GitHub one is linked to an existing native
// EvidenceRecord (ev-1, from lib/mock-data/seed.ts); the Discord one
// deliberately stays unlinked.
// ---------------------------------------------------------------------------

export const evidenceCandidates: EvidenceCandidate[] = [
  { id: 'pf-candidate-github', studentId: STUDENT_ID, importedAssertionId: 'pf-assert-github-contribution', proposedCapabilityIds: ['cap-1'], rationale: 'Sustained, reviewed, tested, and documented contribution to a statistical-analysis toolkit.', linkedEvidenceRecordId: 'ev-1', provenanceId: 'pf-prov-github-contribution' },
  { id: 'pf-candidate-discord', studentId: STUDENT_ID, importedAssertionId: 'pf-assert-discord-signal', proposedCapabilityIds: ['cap-6'], rationale: 'Contextual signal of sustained peer assistance — not itself Evidence.', provenanceId: 'pf-prov-discord-signal' },
  { id: 'pf-candidate-scholar', studentId: STUDENT_ID, importedAssertionId: 'pf-assert-scholar-pub', proposedCapabilityIds: ['cap-3'], rationale: 'Publication would support Research Design once authorship is confirmed.', provenanceId: 'pf-prov-scholar-pub' },
  // Stale/awaiting-review/withheld/disputed demonstration candidates (no external source — native-only, kept minimal).
  { id: 'pf-candidate-stale', studentId: STUDENT_ID, importedAssertionId: 'pf-assert-cv-employment', proposedCapabilityIds: ['cap-3'], rationale: 'Older Research Design demonstration whose confidence has since decayed.', provenanceId: 'pf-prov-stale-basis' },
  { id: 'pf-candidate-review', studentId: STUDENT_ID, importedAssertionId: 'pf-assert-github-contribution', proposedCapabilityIds: ['cap-2'], rationale: 'Data Modeling inference awaiting Faculty review before eligibility.', provenanceId: 'pf-prov-review-basis' },
  { id: 'pf-candidate-withheld', studentId: STUDENT_ID, importedAssertionId: 'pf-assert-discord-signal', proposedCapabilityIds: ['cap-5'], rationale: 'Single low-authority signal — confidence stays below the Passport minimum.', provenanceId: 'pf-prov-withheld-basis' },
  { id: 'pf-candidate-disputed', studentId: STUDENT_ID, importedAssertionId: 'pf-assert-cv-employment', proposedCapabilityIds: ['cap-4'], rationale: 'Basis touches a disputed employment-date assertion.', provenanceId: 'pf-prov-disputed-basis' },
]

const supportingProvenance: ProvenanceRecord[] = [
  { id: 'pf-prov-stale-basis', source: 'cv', sourceIdentifier: 'cv-line-5', owner: STUDENT_ID, importMethod: 'document_upload', importedAt: '2025-05-01T00:00:00.000Z', authorityClass: 'user_asserted', derivationType: 'imported', corroboratingSources: [], linkedArtefactIds: [], disclosurePermissionIds: [] },
  { id: 'pf-prov-review-basis', source: 'github', sourceIdentifier: 'alexchen-dev/data-analysis-toolkit', owner: STUDENT_ID, importMethod: 'oauth_api', importedAt: '2026-07-15T00:00:00.000Z', authorityClass: 'platform_grounded', derivationType: 'directly_observed', corroboratingSources: [], linkedArtefactIds: [], disclosurePermissionIds: [] },
  { id: 'pf-prov-withheld-basis', source: 'discord', sourceIdentifier: 'discord-thread-55', owner: STUDENT_ID, importMethod: 'oauth_api', importedAt: '2026-06-01T00:00:00.000Z', authorityClass: 'user_asserted', derivationType: 'directly_observed', corroboratingSources: [], linkedArtefactIds: [], disclosurePermissionIds: [] },
  { id: 'pf-prov-disputed-basis', source: 'cv', sourceIdentifier: 'cv-line-3', owner: STUDENT_ID, importMethod: 'document_upload', importedAt: '2026-05-02T00:00:00.000Z', authorityClass: 'disputed', derivationType: 'imported', corroboratingSources: [], linkedArtefactIds: [], disclosurePermissionIds: [] },
]
provenanceRecords.push(...supportingProvenance)

// ---------------------------------------------------------------------------
// Capability inference bases + inferences — one per required Passport
// eligibility state (§10), the GitHub one carrying multiple basis records.
// ---------------------------------------------------------------------------

export const capabilityInferenceBases: CapabilityInferenceBasis[] = [
  // Three bases (2 primary + 1 supporting) — the "multiple basis records" demonstration, and strong enough to clear the Strong-confidence eligibility bar.
  { id: 'pf-basis-github-1', description: '4 merged pull requests received code review before merge.', evidenceCandidateId: 'pf-candidate-github', weight: 'primary' },
  { id: 'pf-basis-github-2', description: 'Linked to existing native Evidence (ev-1), corroborating platform activity with an institutional record.', evidenceCandidateId: 'pf-candidate-github', weight: 'primary' },
  { id: 'pf-basis-github-3', description: 'Repository includes a test suite and maintained documentation.', evidenceCandidateId: 'pf-candidate-github', weight: 'supporting' },
  // Strong confidence, but imported long ago and never refreshed — decays into "stale", not "withheld".
  { id: 'pf-basis-stale-1', description: 'Verified research design demonstration from the prior academic year.', evidenceCandidateId: 'pf-candidate-stale', weight: 'primary' },
  { id: 'pf-basis-stale-2', description: 'A second, independently-dated research artefact from the same period.', evidenceCandidateId: 'pf-candidate-stale', weight: 'primary' },
  // Strong confidence, but a pending ReviewRequirement blocks it — "awaiting_review", not "eligible".
  { id: 'pf-basis-review-1', description: 'GitHub contribution proposed against Data Modeling, pending Faculty review.', evidenceCandidateId: 'pf-candidate-review', weight: 'primary' },
  { id: 'pf-basis-review-2', description: 'A second merged pull request touching the same Data Modeling code path.', evidenceCandidateId: 'pf-candidate-review', weight: 'primary' },
  // Deliberately thin — a single low-authority signal, correctly stays below the Passport minimum.
  { id: 'pf-basis-withheld-1', description: 'Single Discord contextual signal, no corroborating artefact.', evidenceCandidateId: 'pf-candidate-withheld', weight: 'supporting' },
  { id: 'pf-basis-disputed-1', description: 'Employment assertion currently disputed between CV and LinkedIn dates.', evidenceCandidateId: 'pf-candidate-disputed', weight: 'primary' },
]

function basesFor(evidenceCandidateId: string): CapabilityInferenceBasis[] {
  return capabilityInferenceBases.filter((b) => b.evidenceCandidateId === evidenceCandidateId)
}

const inferenceGithubBases = basesFor('pf-candidate-github')
const inferenceStaleBases = basesFor('pf-candidate-stale')
const inferenceReviewBases = basesFor('pf-candidate-review')
const inferenceWithheldBases = basesFor('pf-candidate-withheld')
const inferenceDisputedBases = basesFor('pf-candidate-disputed')

export const capabilityInferences: CapabilityInference[] = [
  // eligible + multiple-basis-records demonstration
  { id: 'pf-inf-eligible', studentId: STUDENT_ID, capabilityId: 'cap-1', basisIds: inferenceGithubBases.map((b) => b.id), confidence: computeInferenceConfidence(inferenceGithubBases), maturityEstimate: 'Proficient', provenanceId: 'pf-prov-github-contribution', computedAt: '2026-07-15T00:00:00.000Z' },
  // stale — imported long ago, never refreshed past the freshness threshold
  { id: 'pf-inf-stale', studentId: STUDENT_ID, capabilityId: 'cap-3', basisIds: inferenceStaleBases.map((b) => b.id), confidence: computeInferenceConfidence(inferenceStaleBases), maturityEstimate: 'Developing', provenanceId: 'pf-prov-stale-basis', computedAt: '2025-05-01T00:00:00.000Z' },
  // awaiting_review — a pending ReviewRequirement blocks it
  { id: 'pf-inf-review', studentId: STUDENT_ID, capabilityId: 'cap-2', basisIds: inferenceReviewBases.map((b) => b.id), confidence: computeInferenceConfidence(inferenceReviewBases), maturityEstimate: 'Developing', provenanceId: 'pf-prov-review-basis', computedAt: '2026-07-15T00:00:00.000Z' },
  // withheld — a single supporting basis keeps confidence below the rule set's minimum
  { id: 'pf-inf-withheld', studentId: STUDENT_ID, capabilityId: 'cap-5', basisIds: inferenceWithheldBases.map((b) => b.id), confidence: computeInferenceConfidence(inferenceWithheldBases), maturityEstimate: 'Emerging', provenanceId: 'pf-prov-withheld-basis', computedAt: '2026-06-01T00:00:00.000Z' },
  // disputed — its basis touches a disputed assertion
  { id: 'pf-inf-disputed', studentId: STUDENT_ID, capabilityId: 'cap-4', basisIds: inferenceDisputedBases.map((b) => b.id), confidence: computeInferenceConfidence(inferenceDisputedBases), maturityEstimate: 'Developing', provenanceId: 'pf-prov-disputed-basis', computedAt: '2026-05-02T00:00:00.000Z' },
]

// ---------------------------------------------------------------------------
// Identity resolution, conflicts, duplicate resolution, confirmations, review
// ---------------------------------------------------------------------------

export const identityResolutions: IdentityResolution[] = [
  { id: 'pf-identity-scholar', studentId: STUDENT_ID, sourceAccountId: 'pf-acct-scholar', confidence: 'ambiguous' },
  { id: 'pf-identity-github', studentId: STUDENT_ID, sourceAccountId: 'pf-acct-github', confidence: 'confirmed', resolvedAt: '2026-05-01T00:00:00.000Z', resolvedBy: 'student' },
]

export const conflictRecords: ConflictRecord[] = [
  // Resolved: CV+LinkedIn duplicate employment, merged, provenance preserved.
  { id: 'pf-conflict-employment-dates', studentId: STUDENT_ID, conflictingAssertionIds: ['pf-assert-cv-employment', 'pf-assert-linkedin-employment'], description: 'CV and LinkedIn report different end dates for the same Meridian Labs internship (2025-08-31 vs 2025-09-05).', detectedAt: '2026-05-02T00:00:00.000Z', resolutionId: 'pf-resolution-employment-dates' },
]

export const duplicateResolutions: DuplicateResolution[] = [
  { id: 'pf-resolution-employment-dates', conflictRecordId: 'pf-conflict-employment-dates', action: 'merge', preferredAssertionId: 'pf-assert-linkedin-employment', mergedFromAssertionIds: ['pf-assert-cv-employment', 'pf-assert-linkedin-employment'], resolvedBy: STUDENT_ID, resolvedAt: '2026-05-03T00:00:00.000Z', note: 'Kept the later LinkedIn end date; both original records retained for provenance.' },
]

export const userConfirmations: UserConfirmation[] = [
  { id: 'pf-confirm-github', studentId: STUDENT_ID, targetType: 'evidence_candidate', targetId: 'pf-candidate-github', action: 'confirmed', confirmedAt: '2026-07-16T00:00:00.000Z' },
]

export const reviewRequirements: ReviewRequirement[] = [
  { id: 'pf-review-datamodeling', targetType: 'capability_inference', targetId: 'pf-inf-review', status: 'pending', requiredBecause: 'External-source inference against a Faculty-reviewable capability requires human sign-off before Passport eligibility.' },
]

// ---------------------------------------------------------------------------
// Disclosure permissions — a private record excluded from Portfolio
// publication, plus permissions backing the Passport-visible GitHub claim.
// ---------------------------------------------------------------------------

export const disclosurePermissions: DisclosurePermission[] = [
  { id: 'pf-disclose-github-portfolio-public', studentId: STUDENT_ID, recordType: 'evidence_candidate', recordId: 'pf-candidate-github', audience: 'portfolio_public', allowed: true, setAt: '2026-07-16T00:00:00.000Z' },
  { id: 'pf-disclose-github-passport', studentId: STUDENT_ID, recordType: 'evidence_candidate', recordId: 'pf-candidate-github', audience: 'passport', allowed: true, setAt: '2026-07-16T00:00:00.000Z' },
  { id: 'pf-disclose-cv-employment-passport', studentId: STUDENT_ID, recordType: 'imported_assertion', recordId: 'pf-assert-cv-employment', audience: 'passport', allowed: true, setAt: '2026-05-03T00:00:00.000Z' },
  // The private record explicitly excluded from Portfolio publication (never even considered for the public audience).
  { id: 'pf-disclose-discord-portfolio-public-denied', studentId: STUDENT_ID, recordType: 'evidence_candidate', recordId: 'pf-candidate-discord', audience: 'portfolio_public', allowed: false, setAt: '2026-06-02T00:00:00.000Z' },
]

/** Every EvidenceCandidate id that exists — used by the disclosure validator to confirm the Discord candidate never appears in a public-audience projection. */
export const allEvidenceCandidateIds = evidenceCandidates.map((c) => c.id)

// ---------------------------------------------------------------------------
// Passport projection rule + live eligibility evaluation
// ---------------------------------------------------------------------------

export const passportProjectionRuleV1: PassportProjectionRule = {
  id: 'pf-rule-v1',
  version: 'v1',
  description: 'Stage A default rule set — Strong confidence minimum, review required, 180-day freshness threshold.',
  minimumConfidenceBand: 'Strong',
  requiresReview: true,
  freshnessThresholdDays: 180,
}

const provenanceById = new Map(provenanceRecords.map((p) => [p.id, p]))

export const passportEligibilityEvaluation = evaluatePassportEligibility({
  studentId: STUDENT_ID,
  ruleSet: passportProjectionRuleV1,
  profileRevision: 'rev-2026-07-20',
  inferences: capabilityInferences,
  provenanceById,
  reviewRequirements,
  conflicts: conflictRecords,
  disputedInferenceIds: new Set(['pf-inf-disputed']),
  now: PROFILE_NOW,
})

// ---------------------------------------------------------------------------
// Portfolio — one profile, two audiences, one publication history
// (published then unpublished).
// ---------------------------------------------------------------------------

export const portfolioSlug: PortfolioSlug = { id: 'pf-slug-1', slug: 'alexchen', studentId: STUDENT_ID, reserved: false, claimedAt: '2026-06-10T00:00:00.000Z' }

export const portfolioProfile: PortfolioProfile = {
  id: 'pf-portfolio-1',
  studentId: STUDENT_ID,
  headline: 'BSc Computer Science — Data Analysis & Machine Learning',
  statement: 'Building toward a Data Scientist role through verified coursework, an open-source analysis toolkit, and ongoing research.',
  templateId: 'template-standard',
  slugId: portfolioSlug.id,
  status: 'unpublished',
  searchEngineIndexingAllowed: false,
  contactVisible: false,
  sections: [
    { id: 'pf-section-identity', type: 'identity_statement', order: 0, visible: true, recordIds: [] },
    { id: 'pf-section-capabilities', type: 'capabilities', order: 1, visible: true, recordIds: ['cap-1'] },
    { id: 'pf-section-github', type: 'github', order: 2, visible: true, recordIds: ['pf-candidate-github'] },
    { id: 'pf-section-recommendations', type: 'recommendations', order: 3, visible: false, recordIds: [] },
  ],
}

export const portfolioAudiences: PortfolioAudience[] = [
  { id: 'pf-audience-employer', portfolioProfileId: portfolioProfile.id, audienceType: 'employer', sectionVisibilityOverrides: { 'pf-section-recommendations': true } },
  { id: 'pf-audience-academic', portfolioProfileId: portfolioProfile.id, audienceType: 'academic_research', sectionVisibilityOverrides: { 'pf-section-github': false } },
]

export const portfolioPublications: PortfolioPublication[] = [
  { id: 'pf-publication-1', portfolioProfileId: portfolioProfile.id, version: 1, publishedAt: '2026-06-15T00:00:00.000Z', unpublishedAt: '2026-07-01T00:00:00.000Z', snapshot: { ...portfolioProfile, status: 'published' } },
]

// ---------------------------------------------------------------------------
// Runs unconditionally, mirroring lib/mock-data/seed.ts's own
// validateSeedData pattern — never gated behind NODE_ENV, since a
// production build always sets it and a dev-only guard would mean this
// never executes in an actual build.
// ---------------------------------------------------------------------------

const profileDataErrors = validateProfileData({
  sourceAccounts,
  externalConnections,
  sourceRefreshes,
  sourceRecords,
  importedAssertions,
  provenanceRecords,
  evidenceCandidates,
  capabilityInferenceBases,
  capabilityInferences,
  identityResolutions,
  conflictRecords,
  duplicateResolutions,
  userConfirmations,
  reviewRequirements,
  disclosurePermissions,
  passportProjectionRuleV1,
  passportEligibilityEvaluation,
  portfolioSlug,
  portfolioProfile,
  portfolioAudiences,
  portfolioPublications,
  nativeEvidenceIds: new Set(nativeEvidenceRecords.map((e) => e.id)),
})
if (profileDataErrors.length > 0) {
  throw new Error(`Profile intelligence data integrity check failed:\n${profileDataErrors.join('\n')}`)
}
