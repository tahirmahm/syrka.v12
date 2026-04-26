import Link from 'next/link'

interface Directive {
  number: string
  title: string
  body: string
  priority: 'critical' | 'recommended' | 'pending'
  tag: string
  subLabel?: string
  opacity: number
  ctas: { label: string; style: 'primary' | 'secondary' | 'accent'; href?: string }[]
}

const DIRECTIVES: Directive[] = [
  {
    number: '01',
    title: 'INITIALIZE M249 EXECUTION',
    body: 'M249 completion unblocks TM258 — the highest-ROI Stage 2 module. Without it, statistical models project 78% failure probability in TM258 algorithmic units. Concurrent execution with TM129 recommended for optimal velocity.',
    priority: 'critical',
    tag: 'CRITICAL',
    opacity: 1,
    ctas: [
      { label: 'Execute Now', style: 'primary', href: '?tab=intelligence&module=M249' },
      { label: 'Defer 1 Week', style: 'secondary' },
    ],
  },
  {
    number: '02',
    title: 'INITIATE TM129 CONCURRENTLY',
    body: 'Parallel execution of TM129 alongside M249 accelerates Stage 2 completion by approximately 2 months. TM129 has no dependency conflicts with M249 and shares prerequisite overlap. Combined completion unblocks 3 Stage 3 modules.',
    priority: 'recommended',
    tag: 'RECOMMENDED',
    opacity: 1,
    ctas: [
      { label: 'Add to Active', style: 'accent', href: '?tab=intelligence&module=TM129' },
    ],
  },
  {
    number: '03',
    title: 'PROCEED WITH TM258',
    body: 'Once M249 and M248 are complete, TM258 becomes the highest-priority module. It contributes 12% toward the ML Engineer career vector and is the gateway to all Stage 3 modules.',
    priority: 'pending',
    tag: 'PENDING',
    subLabel: 'Awaiting M249',
    opacity: 0.55,
    ctas: [],
  },
  {
    number: '04',
    title: 'COMPLETE STATISTICS FOUNDATION → UNLOCK STAGE 3',
    body: 'The statistics chain (M249 → M248 → TM258) is the critical path. Completing this chain unlocks TM358, TM351, and TM470 — representing 41% of remaining career contribution.',
    priority: 'pending',
    tag: 'PENDING',
    opacity: 0.4,
    ctas: [],
  },
]

const TAG_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  CRITICAL: { bg: 'rgba(103,156,255,0.1)', color: '#679cff', border: 'rgba(103,156,255,0.2)' },
  RECOMMENDED: { bg: 'rgba(169,171,178,0.1)', color: '#a9abb2', border: 'rgba(169,171,178,0.2)' },
  PENDING: { bg: 'rgba(69,72,78,0.3)', color: '#45484e', border: 'rgba(69,72,78,0.4)' },
}

export default function Directives({ country }: { country: string }) {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      <span style={{ fontSize: 9, color: '#73757c', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace' }} className="font-label uppercase block mb-3">
        Intelligence Directives
      </span>
      <h2 className="font-headline" style={{ fontSize: 28, fontWeight: 800, color: '#e3e5ed', letterSpacing: '-0.02em', marginBottom: 24 }}>
        EXECUTION PLAN
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {DIRECTIVES.map((dir) => {
          const tagStyle = TAG_STYLES[dir.tag]
          const isCritical = dir.priority === 'critical'

          return (
            <div
              key={dir.number}
              style={{
                opacity: dir.opacity,
                background: isCritical ? '#0a0c10' : '#121316',
                border: isCritical ? '1px solid rgba(103,156,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                borderTop: isCritical ? '3px solid #679cff' : undefined,
                padding: 24,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="font-label uppercase inline-flex items-center"
                  style={{
                    padding: '2px 8px', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace',
                    background: tagStyle.bg, color: tagStyle.color,
                    border: `1px solid ${tagStyle.border}`,
                  }}
                >
                  {dir.tag}
                </span>
                <span style={{ fontSize: 10, color: '#73757c' }}>
                  Directive {dir.number} · Auto-Generated
                </span>
                {dir.subLabel && (
                  <span style={{ fontSize: 10, color: '#45484e' }}>· {dir.subLabel}</span>
                )}
              </div>

              <h3
                className="font-headline"
                style={{
                  fontSize: isCritical ? 22 : 18,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                  color: '#e3e5ed',
                  marginBottom: 8,
                }}
              >
                {dir.title}
              </h3>

              <p style={{ fontSize: 13, color: '#939eb4', lineHeight: 1.5, marginBottom: dir.ctas.length > 0 ? 16 : 0 }}>
                {dir.body}
              </p>

              {dir.ctas.length > 0 && (
                <div className="flex items-center gap-3">
                  {dir.ctas.map((cta) => {
                    const base = {
                      textDecoration: 'none' as const,
                      fontSize: 11,
                      fontWeight: 700 as const,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      padding: '10px 20px',
                      cursor: 'pointer' as const,
                      display: 'inline-flex' as const,
                      alignItems: 'center' as const,
                      gap: 8,
                      fontFamily: 'Space Grotesk, sans-serif',
                    }

                    const styles = cta.style === 'primary'
                      ? { ...base, background: '#c4c7ca', color: '#3d4143', border: 'none' }
                      : cta.style === 'accent'
                        ? { ...base, background: 'transparent', color: '#679cff', border: '1px solid rgba(103,156,255,0.3)' }
                        : { ...base, background: 'transparent', color: '#a9abb2', border: '1px solid rgba(255,255,255,0.15)' }

                    if (cta.href) {
                      return (
                        <Link key={cta.label} href={`/${country}/student${cta.href}`} style={styles}>
                          {cta.label}
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                        </Link>
                      )
                    }
                    return (
                      <button key={cta.label} style={styles}>
                        {cta.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
