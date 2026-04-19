'use client'

interface WordmarkProps {
  country?: string
  size?: 'sm' | 'md' | 'lg'
  theme?: 'dark' | 'light'
}

const accents: Record<string, string> = {
  saudi: '#C9A84C',
  malta: '#1D9E75',
  uk:    '#3B8BD4',
}

export default function SyrkaWordmark({ country = 'saudi', size = 'md', theme = 'dark' }: WordmarkProps) {
  const accent = accents[country] || '#C9A84C'
  const wordmarkColor = theme === 'light' ? '#0A0C10' : accent

  const sizes = {
    sm:  { wordmark: 16, sub: 8  },
    md:  { wordmark: 20, sub: 9  },
    lg:  { wordmark: 30, sub: 10 },
  }[size]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, userSelect: 'none' }}>
      <span style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: sizes.wordmark,
        fontWeight: 800,
        color: wordmarkColor,
        letterSpacing: '-0.3px',
        lineHeight: 1,
      }}>
        Syrka
      </span>
      <span style={{
        fontSize: sizes.sub,
        fontWeight: 500,
        letterSpacing: '1.5px',
        color: 'var(--text-faint)',
        textTransform: 'uppercase' as const,
        lineHeight: 1,
      }}>
        Human Capital Intelligence
      </span>
    </div>
  )
}
