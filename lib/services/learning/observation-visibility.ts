import type { InstructionalDisclosureRule, VisibilityTier } from '@/lib/campus-types'

/**
 * Every disclosure check goes through an explicit rule — there is no
 * default-visible tier. Department/University aggregate reporting is the
 * only tier that can require de-identification and a minimum cohort size;
 * no individual Tutor transcript or raw observation ever reaches it.
 */
export function isDisclosureAllowed(rules: InstructionalDisclosureRule[], fromTier: VisibilityTier, toTier: VisibilityTier): boolean {
  const rule = rules.find((r) => r.fromTier === fromTier && r.toTier === toTier)
  return Boolean(rule?.allowed)
}

export function requiresDeidentification(rules: InstructionalDisclosureRule[], fromTier: VisibilityTier, toTier: VisibilityTier): boolean {
  const rule = rules.find((r) => r.fromTier === fromTier && r.toTier === toTier)
  return Boolean(rule?.requiresDeidentification)
}

export function minimumCohortSizeRequired(rules: InstructionalDisclosureRule[], fromTier: VisibilityTier, toTier: VisibilityTier): number | undefined {
  const rule = rules.find((r) => r.fromTier === fromTier && r.toTier === toTier)
  return rule?.requiresMinimumCohortSize
}
