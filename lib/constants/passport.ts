import type { DisclosureSettings, PassportClaimVerificationState, PassportAudience, LinkExpiryPreference } from '@/lib/campus-types'
import type { BadgeTone } from '@/components/ui/Badge'

/**
 * Presentation-layer label for the Campus student-facing Passport surface.
 * The underlying domain concept stays the generic Passport type
 * (lib/campus-types/passport.ts) per ADR-002/ONT-001; only the UI label
 * differs by surface. Do not rename the type — change this constant instead.
 */
export const PASSPORT_DISPLAY_NAME = 'Syrka Career Passport'

/**
 * Conservative default disclosure preferences for the sharing/preview demo —
 * frontend-only mock state, never persisted or connected to a real link.
 */
export const DEFAULT_DISCLOSURE_SETTINGS: DisclosureSettings = {
  includeIdentity: true,
  includeCourseContext: false,
  includeReviewerInfo: false,
  excludeStaleClaims: true,
  excludeRevokedClaims: true,
  audience: 'general',
  linkExpiryPreference: '30_days',
}

export const CLAIM_VERIFICATION_LABELS: Record<PassportClaimVerificationState, string> = {
  verified: 'Verified',
  strong_unverified: 'Strong (unverified)',
  supported: 'Supported',
  stale: 'Stale',
  revoked: 'Revoked',
}

export const CLAIM_VERIFICATION_TONES: Record<PassportClaimVerificationState, BadgeTone> = {
  verified: 'gold',
  strong_unverified: 'blue',
  supported: 'blue',
  stale: 'neutral',
  revoked: 'red',
}

export const AUDIENCE_LABELS: Record<PassportAudience, string> = {
  employer: 'Employer',
  graduate_programme: 'Graduate programme',
  general: 'General',
  custom: 'Custom',
}

export const LINK_EXPIRY_LABELS: Record<LinkExpiryPreference, string> = {
  never: 'Never expires',
  '7_days': '7 days',
  '30_days': '30 days',
  '90_days': '90 days',
}
