'use client'

interface CountryBadgeProps {
  country: string
  visionName: string
  accentColor: string
}

const displayNames: Record<string, string> = {
  malta: 'Republic of Malta',
  saudi: 'Kingdom of Saudi Arabia',
  uk: 'United Kingdom',
}

export default function CountryBadge({ country, visionName, accentColor }: CountryBadgeProps) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 10px',
      borderRadius: 'var(--r-md)',
      border: `0.5px solid ${accentColor}30`,
      fontSize: 11,
      color: accentColor,
      letterSpacing: '0.3px',
    }}>
      <span style={{ fontWeight: 600 }}>{displayNames[country] || country}</span>
      <span style={{ opacity: 0.3 }}>|</span>
      <span style={{ fontWeight: 400, fontSize: 10 }}>{visionName}</span>
    </div>
  )
}
