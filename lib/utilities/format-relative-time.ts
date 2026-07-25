const DAY_MS = 24 * 60 * 60 * 1000

/** Coarse, locale-agnostic relative time for evidence/claim freshness display. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffDays = Math.round((now.getTime() - new Date(iso).getTime()) / DAY_MS)
  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  const months = Math.round(diffDays / 30)
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`
  const years = Math.round(diffDays / 365)
  return `${years} ${years === 1 ? 'year' : 'years'} ago`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}
