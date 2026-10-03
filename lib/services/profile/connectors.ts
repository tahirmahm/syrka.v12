import type { ConnectorAuditRecord, ConnectorDefinition, SourceCategory } from '@/lib/campus-types'

/**
 * Stage A connector definitions and audit records — the feasibility read
 * from the approved Passport Intelligence checkpoint, not a live
 * integration. `implementationAllowed: false` on every non-native
 * connector reflects that live API work has not begun; each must be
 * re-audited (see `nextAuditTrigger`) immediately before its Stage C/D
 * implementation starts, per the checkpoint's standing rule that this is a
 * feasibility read, never a permanent legal or platform clearance.
 */
export const CONNECTOR_AUDITS: Record<SourceCategory, ConnectorAuditRecord> = {
  campus_learning: {
    id: 'audit-campus_learning',
    sourceCategory: 'campus_learning',
    auditStatus: 'audited',
    implementationAllowed: true,
    knownRestrictions: [],
    requiredScopes: [],
    nextAuditTrigger: 'Native Syrka source — no external terms; re-audit only if data retention policy changes.',
  },
  odyssey: {
    id: 'audit-odyssey',
    sourceCategory: 'odyssey',
    auditStatus: 'audited',
    implementationAllowed: true,
    knownRestrictions: [],
    requiredScopes: [],
    nextAuditTrigger: 'Native Syrka source — no external terms; re-audit only if data retention policy changes.',
  },
  user_entered: {
    id: 'audit-user_entered',
    sourceCategory: 'user_entered',
    auditStatus: 'audited',
    implementationAllowed: true,
    knownRestrictions: [],
    requiredScopes: [],
    nextAuditTrigger: 'Direct user input — no external terms.',
  },
  cv: {
    id: 'audit-cv',
    sourceCategory: 'cv',
    auditStatus: 'audited',
    implementationAllowed: false,
    officialDocumentationReference: 'N/A — user-uploaded document, no third-party API',
    knownRestrictions: ['No third-party platform terms apply — the student uploads their own document.'],
    requiredScopes: [],
    retentionRequirements: 'Retain only what the student confirms; delete on disconnect/request.',
    deletionRequirements: 'Full deletion of the uploaded document and all derived ImportedAssertions on request.',
    nextAuditTrigger: 'Re-audit when a PDF/document-parsing library is selected, to confirm its own licence terms.',
  },
  github: {
    id: 'audit-github',
    sourceCategory: 'github',
    auditStatus: 'audited',
    implementationAllowed: false,
    officialDocumentationReference: 'https://docs.github.com/en/rest',
    termsReference: 'https://docs.github.com/en/site-policy/github-terms/github-terms-of-service',
    knownRestrictions: [
      'Standard REST/GraphQL rate limits apply per authenticated app/user.',
      'Private repository content must never be exposed publicly without explicit per-repository permission.',
    ],
    requiredScopes: ['read:user', 'repo (read-only, only for repos the student explicitly includes)'],
    retentionRequirements: 'Refresh on a defined cadence; do not retain excluded/private repository content beyond what the student opted in.',
    deletionRequirements: 'Revoke OAuth grant and delete imported repository/commit/PR data on disconnect.',
    nextAuditTrigger: 'Re-audit immediately before Stage C implementation begins, and again before production release.',
  },
  google_scholar: {
    id: 'audit-google_scholar',
    sourceCategory: 'google_scholar',
    auditStatus: 'audited',
    implementationAllowed: false,
    officialDocumentationReference: 'No official public API exists at time of writing.',
    knownRestrictions: [
      'No first-party API for third-party access — unofficial scraping libraries generally sit against typical terms and are not an acceptable integration path.',
      'Namesake/ambiguous-authorship risk is structural, not incidental — routes through IdentityResolution before any inference is trusted.',
    ],
    requiredScopes: [],
    retentionRequirements: 'Retain only confirmed-identity publications; treat unconfirmed matches as pending, never surfaced.',
    deletionRequirements: 'Delete imported publication records and any IdentityResolution rows on disconnect.',
    nextAuditTrigger: 'Re-audit immediately before Stage C implementation to confirm whether any official/partner API access exists by then; if not, ship only the user-authorised citation-export import path.',
  },
  linkedin: {
    id: 'audit-linkedin',
    sourceCategory: 'linkedin',
    auditStatus: 'audited',
    implementationAllowed: false,
    officialDocumentationReference: 'https://learn.microsoft.com/en-us/linkedin/',
    termsReference: 'https://legal.linkedin.com/api-terms-of-use',
    knownRestrictions: [
      'Public third-party API access has been narrow since the 2018 API changes; most useful profile/connections scopes require Partner Program approval.',
      'Endorsements are social signals, never verified Capability Evidence.',
    ],
    requiredScopes: ['Whatever minimal profile scope is available to non-partner OAuth apps — to be confirmed at audit time.'],
    retentionRequirements: 'Retain only what the student explicitly imports via authorised export or the available OAuth scope.',
    deletionRequirements: 'Delete imported profile/employment/education records on disconnect.',
    nextAuditTrigger: 'Re-audit immediately before Stage D implementation to confirm current Partner Program status; default to the user-authorised data-export import path unless direct OAuth access is confirmed sufficient.',
  },
  discord: {
    id: 'audit-discord',
    sourceCategory: 'discord',
    auditStatus: 'audited',
    implementationAllowed: false,
    officialDocumentationReference: 'https://discord.com/developers/docs/intro',
    termsReference: 'https://discord.com/developers/docs/policies-and-agreements/developer-terms-of-service',
    knownRestrictions: [
      'Official OAuth2 + Bot API exists with granular per-guild/per-channel permission scopes — access is technically available; sensitivity is the real constraint.',
      'Never ingest private messages, unrelated conversations, personal behavioural profiling, sensitive-category inference, or server history without explicit authority and consent.',
      'Message-content intent requires separate Discord approval for verified bots.',
      'Treated as a low-authority contextual signal unless corroborated by a tangible artefact.',
    ],
    requiredScopes: ['identify', 'guilds (read-only, explicit per-guild install)', 'messages (channel-scoped, only with explicit consent and message-content-intent approval)'],
    retentionRequirements: 'Collection period must be explicitly bounded; no open-ended history ingestion.',
    deletionRequirements: 'Full deletion of imported channel/message-derived signals on disconnect or consent withdrawal.',
    nextAuditTrigger: 'Re-audit immediately before Stage D implementation to confirm current message-content-intent approval requirements and any guild-permission-model changes.',
  },
}

export const CONNECTOR_DEFINITIONS: Record<SourceCategory, ConnectorDefinition> = {
  campus_learning: { sourceCategory: 'campus_learning', displayName: 'Syrka Campus Learning', integrationPath: 'native', auditId: 'audit-campus_learning' },
  odyssey: { sourceCategory: 'odyssey', displayName: 'Odyssey', integrationPath: 'native', auditId: 'audit-odyssey' },
  user_entered: { sourceCategory: 'user_entered', displayName: 'Manually entered', integrationPath: 'native', auditId: 'audit-user_entered' },
  cv: { sourceCategory: 'cv', displayName: 'CV / résumé import', integrationPath: 'document_upload', auditId: 'audit-cv' },
  github: { sourceCategory: 'github', displayName: 'GitHub', integrationPath: 'official_oauth_api', auditId: 'audit-github' },
  google_scholar: { sourceCategory: 'google_scholar', displayName: 'Google Scholar', integrationPath: 'user_authorised_export', auditId: 'audit-google_scholar' },
  linkedin: { sourceCategory: 'linkedin', displayName: 'LinkedIn', integrationPath: 'user_authorised_export', auditId: 'audit-linkedin' },
  discord: { sourceCategory: 'discord', displayName: 'Discord', integrationPath: 'official_oauth_api', auditId: 'audit-discord' },
}
