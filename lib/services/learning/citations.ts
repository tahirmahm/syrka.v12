import type { SourceReference, LearningDocumentVersion, ExtractionWarning } from '@/lib/campus-types'

/**
 * The model may request a citation; only Syrka resolves and renders one.
 * A citation the model claims that doesn't resolve to a canonical
 * SourceReference is rejected outright, never rendered as if valid.
 */

export interface CitationValidationInput {
  reference: SourceReference
  knownReferenceIds: Set<string>
  documentVersions: Map<string, LearningDocumentVersion>
  extractionWarnings: ExtractionWarning[]
  requireResolvedHighSeverityWarnings: boolean
}

export function validateCitation(input: CitationValidationInput): string[] {
  const errors: string[] = []

  if (!input.knownReferenceIds.has(input.reference.id)) {
    errors.push(`Citation references unknown SourceReference id "${input.reference.id}".`)
    return errors
  }

  const version = input.documentVersions.get(input.reference.documentVersionId)
  if (!version || version.documentId !== input.reference.documentId) {
    errors.push(`Citation's documentVersionId "${input.reference.documentVersionId}" does not match its documentId "${input.reference.documentId}".`)
  }

  const pageWarnings = input.extractionWarnings.filter((w) => w.pageId === input.reference.pageId)
  const unresolvedHigh = pageWarnings.filter((w) => w.severity === 'high' && !w.resolved)
  if (input.requireResolvedHighSeverityWarnings && unresolvedHigh.length > 0) {
    errors.push(`Citation points at a page with ${unresolvedHigh.length} unresolved high-severity extraction warning(s).`)
  }

  return errors
}

/** A page/citation id the model claims that isn't in the canonical set — rejected, never displayed. */
export function validateModelClaimedCitation(claimedReferenceId: string, knownReferenceIds: Set<string>): string[] {
  if (!knownReferenceIds.has(claimedReferenceId)) {
    return [`Model referenced citation id "${claimedReferenceId}", which does not exist in canonical source data — rejected, not rendered.`]
  }
  return []
}
