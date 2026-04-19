export const ACCENTS: Record<string, string> = {
  saudi: '#C9A84C',
  malta: '#1D9E75',
  uk:    '#3B8BD4',
}

export const COUNTRY_NAMES: Record<string, string> = {
  saudi: 'Kingdom of Saudi Arabia',
  malta: 'Republic of Malta',
  uk:    'United Kingdom',
}

export const VISION_NAMES: Record<string, string> = {
  saudi: 'Saudi Vision 2030',
  malta: 'Malta Vision 2050',
  uk:    'AI Opportunities Action Plan',
}

export const VISION_YEARS: Record<string, number> = {
  saudi: 2030,
  malta: 2050,
  uk:    2030,
}

export function formatGap(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}
