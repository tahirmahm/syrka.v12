'use client'

interface CountryBadgeProps {
  country: string
  visionName: string
  accentColor: string
}

export default function CountryBadge({ country, visionName, accentColor }: CountryBadgeProps) {
  const displayNames: Record<string, string> = {
    malta: 'Republic of Malta',
    saudi: 'Kingdom of Saudi Arabia',
    uk: 'United Kingdom',
  }
  const displayName = displayNames[country] || country

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs tracking-widest uppercase"
      style={{ borderColor: `${accentColor}40`, color: accentColor }}
    >
      <span>{displayName}</span>
      <span className="opacity-40">|</span>
      <span className="font-display normal-case tracking-normal text-sm">{visionName}</span>
    </div>
  )
}
