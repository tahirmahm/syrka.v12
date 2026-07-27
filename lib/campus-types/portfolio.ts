/**
 * Layer 3 — the public Syrka Portfolio (Checkpoint §1, §11). A
 * user-curated public projection of the private profile and Career
 * Passport, rendered at syrka.co/[username]. Never published by default;
 * every public field traces back to an explicit DisclosurePermission
 * (lib/campus-types/profile.ts).
 */

export type PortfolioSectionType =
  | 'identity_statement'
  | 'passport_card'
  | 'capabilities'
  | 'evidence'
  | 'projects'
  | 'github'
  | 'publications'
  | 'employment'
  | 'education'
  | 'odyssey_direction'
  | 'certifications'
  | 'recommendations'
  | 'contact'

/** One ordered, independently-toggleable block. recordIds point at whatever underlying entity this section draws from (an EvidenceCandidate, a CapabilityInference, an ImportedAssertion, ...). */
export interface PortfolioSection {
  id: string
  type: PortfolioSectionType
  order: number
  visible: boolean
  recordIds: string[]
}

export type PortfolioStatus = 'draft' | 'published' | 'unpublished'

/** The public portfolio's own root object — a curated, separately-editable document, not the private profile itself. */
export interface PortfolioProfile {
  id: string
  studentId: string
  headline?: string
  statement?: string
  templateId: string
  sections: PortfolioSection[]
  slugId: string
  status: PortfolioStatus
  searchEngineIndexingAllowed: boolean
  contactVisible: boolean
}

export type PortfolioAudienceType = 'employer' | 'academic_research' | 'general_public'

/** A named projection lens over one PortfolioProfile — not a separate document. Overrides section visibility per audience (e.g. hide "Recommendations" from the general-public view). */
export interface PortfolioAudience {
  id: string
  portfolioProfileId: string
  audienceType: PortfolioAudienceType
  sectionVisibilityOverrides: Record<string, boolean>
}

/** A specific published (or unpublished) version — "what did the public see on a given date" is always answerable. */
export interface PortfolioPublication {
  id: string
  portfolioProfileId: string
  version: number
  publishedAt?: string
  unpublishedAt?: string
  snapshot: PortfolioProfile
}

/** The reserved-slug-checked username record backing syrka.co/[username]. See lib/services/profile/reserved-slugs.ts for the registry and validator. */
export interface PortfolioSlug {
  id: string
  slug: string
  studentId?: string
  reserved: boolean
  claimedAt?: string
}
