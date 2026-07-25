import type { ConfidenceScore } from './confidence'

/**
 * Passport — one evidence-backed domain model (ADR-002 §3.19, ONT-001).
 * The Campus student surface presents this as "Academic Passport"
 * (see lib/constants/passport.ts); the underlying type stays generic so a
 * future professional/employer-facing Passport surface can reuse it.
 */
export type PassportClaimStatus = 'active' | 'shared' | 'expired' | 'revoked'

export interface PassportClaim {
  id: string
  capabilityId: string
  capabilityName: string
  maturity: string
  confidence: ConfidenceScore
  evidenceIds: string[]
  status: PassportClaimStatus
  issuedAt: string
}

export interface PassportVersion {
  version: number
  issuedAt: string
  claims: PassportClaim[]
}

export interface Passport {
  id: string
  studentId: string
  institutionId: string
  programmeId: string
  currentVersion: number
  versions: PassportVersion[]
  verificationSeal: {
    issuer: string
    verifiedAt: string
  }
  sharing: {
    shareableLinkEnabled: boolean
    redactedFields: string[]
  }
}
