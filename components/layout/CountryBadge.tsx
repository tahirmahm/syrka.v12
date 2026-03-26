'use client'

interface CountryBadgeProps {
  country: string
  visionName: string
  accentColor: string
}

export default function CountryBadge({ country, visionName, accentColor }: CountryBadgeProps) {
  const displayName = country === 'malta' ? 'Republic of Malta' : 'Kingdom of Saudi Arabia'

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
