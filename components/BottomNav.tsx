'use client'

const ACCENTS: Record<string, string> = {
  saudi: '#C9A84C',
  malta: '#1D9E75',
  uk:    '#3B8BD4',
}

const items = [
  { id: 'ministry',   label: 'Ministry',   icon: '\u2B21' },
  { id: 'university', label: 'University', icon: '\u25C8' },
  { id: 'employer',   label: 'Employer',   icon: '\u25C9' },
  { id: 'student',    label: 'Student',    icon: '\u25CE' },
]

interface BottomNavProps {
  country: string
  activeTrack: string
}

export default function BottomNav({ country, activeTrack }: BottomNavProps) {
  const accent = ACCENTS[country] || '#C9A84C'

  return (
    <nav style={{
      display: 'flex',
      background: 'var(--bg-surface)',
      borderTop: '0.5px solid var(--border-subtle)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      width: '100%',
    }}>
      {items.map(item => (
        <a key={item.id} href={`/${country}/${item.id}`} style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          padding: '10px 4px 8px',
          textDecoration: 'none',
          color: activeTrack === item.id ? accent : 'var(--text-faint)',
          fontSize: 9,
          letterSpacing: '0.5px',
          fontWeight: activeTrack === item.id ? 600 : 400,
          borderTop: `2px solid ${activeTrack === item.id ? accent : 'transparent'}`,
          minHeight: 44,
          WebkitTapHighlightColor: 'transparent',
        }}>
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          {item.label.toUpperCase()}
        </a>
      ))}
    </nav>
  )
}
