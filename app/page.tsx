import { createClient } from '@/lib/supabase'

async function getVisionStats() {
  try {
    const supabase = createClient()
    const { data: visions } = await supabase
      .from('national_visions')
      .select('*')
      .order('country')

    const stats: Record<string, { totalGap: number; sectorCount: number; institutionCount: number }> = {}

    for (const v of visions || []) {
      const { data: sectors } = await supabase
        .from('sectors')
        .select('current_workforce, target_workforce')
        .eq('vision_id', v.id)

      const { count } = await supabase
        .from('institutions')
        .select('*', { count: 'exact', head: true })
        .eq('vision_id', v.id)

      const totalGap = sectors?.reduce((sum, s) => sum + (s.target_workforce - s.current_workforce), 0) || 0
      stats[v.slug] = {
        totalGap,
        sectorCount: sectors?.length || 0,
        institutionCount: count || 0,
      }
    }

    return stats
  } catch {
    return {}
  }
}

function formatGap(gap: number): string {
  if (gap >= 1_000_000) return `${(gap / 1_000_000).toFixed(gap >= 10_000_000 ? 1 : 2)}M`
  if (gap >= 1_000) return `${(gap / 1_000).toFixed(1)}K`
  return gap.toLocaleString()
}

const COUNTRIES = [
  {
    slug: 'saudi', name: 'Kingdom of Saudi Arabia', vision: 'Saudi Vision 2030',
    accent: '#C9A84C', fallbackGap: '2.19M', gapLabel: 'workers gap',
    fallbackSectors: 6, fallbackInstitutions: 5,
  },
  {
    slug: 'malta', name: 'Republic of Malta', vision: 'Malta Vision 2050',
    accent: '#1D9E75', fallbackGap: '81.2K', gapLabel: 'workers gap',
    fallbackSectors: 5, fallbackInstitutions: 3,
  },
  {
    slug: 'uk', name: 'United Kingdom', vision: 'AI Opportunities Action Plan',
    accent: '#3B8BD4', fallbackGap: '9.0M', gapLabel: 'workers to upskill',
    fallbackSectors: 6, fallbackInstitutions: 7,
  },
]

const DATA_SOURCES = ['World Bank', 'ILO', 'OECD', 'UNESCO', 'ESCO', 'WEF', 'QS Rankings', 'THE Rankings', 'Wikidata']

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const stats = await getVisionStats()

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(24px, 5vw, 64px) clamp(16px, 4vw, 24px)',
      textAlign: 'center',
    }}>
      {/* Logo */}
      <div className="fade-up" style={{ marginBottom: 'clamp(32px, 5vw, 48px)' }}>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(28px, 8vw, 48px)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-1px',
          marginBottom: 14,
        }}>
          Syrka
        </div>
        <p style={{
          fontSize: 'clamp(13px, 2vw, 15px)',
          color: 'var(--text-muted)',
          maxWidth: 480,
          lineHeight: 1.7,
          margin: '0 auto 8px',
        }}>
          From National Vision to Human Capital Reality.
          The only platform that connects government skill targets
          to workforce intelligence.
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          No conflict of interest — we do not run the rankings we help you improve.
        </p>
      </div>

      {/* Country cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 'clamp(12px, 2vw, 16px)',
        width: '100%',
        maxWidth: 920,
        marginBottom: 'clamp(32px, 5vw, 48px)',
      }}>
        {COUNTRIES.map((c, i) => {
          const s = stats[c.slug]
          const gap = s ? formatGap(s.totalGap) : c.fallbackGap
          const sectors = s?.sectorCount || c.fallbackSectors
          const institutions = s?.institutionCount || c.fallbackInstitutions

          return (
            <a key={c.slug} href={`/${c.slug}/ministry`}
              className={`fade-up delay-${i + 1}`}
              style={{
                display: 'block',
                background: 'var(--bg-surface)',
                border: '0.5px solid var(--border-subtle)',
                borderTop: `2px solid ${c.accent}`,
                borderRadius: 'var(--r-lg)',
                padding: 'clamp(16px, 3vw, 20px)',
                textDecoration: 'none',
                textAlign: 'left',
                transition: 'background var(--t-base), border-color var(--t-base)',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                {c.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.3px', marginBottom: 20 }}>
                {c.vision}
              </div>
              <div className="num" style={{
                fontSize: 'clamp(24px, 5vw, 32px)',
                color: c.accent,
                lineHeight: 1,
                marginBottom: 4,
              }}>
                {gap}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>
                {c.gapLabel}
              </div>
              <div style={{
                display: 'flex', gap: 16,
                fontSize: 11, color: 'var(--text-faint)',
                marginBottom: 20,
              }}>
                <span>{sectors} sectors</span>
                <span>{institutions} institutions</span>
              </div>
              <div style={{
                background: c.accent,
                color: '#0A0C10',
                fontSize: 11,
                fontWeight: 700,
                padding: '9px 14px',
                borderRadius: 'var(--r-sm)',
                textAlign: 'center',
                letterSpacing: '0.3px',
              }}>
                Enter Dashboard &rarr;
              </div>
            </a>
          )
        })}
      </div>

      {/* Data sources */}
      <div className="fade-up delay-4" style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 600,
      }}>
        {DATA_SOURCES.map(s => (
          <span key={s} style={{
            fontSize: 9,
            color: 'var(--text-faint)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: 3,
            padding: '3px 8px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            {s}
          </span>
        ))}
      </div>

      {/* Footer */}
      <p className="fade-up delay-5" style={{
        fontSize: 10, color: 'var(--text-faint)', marginTop: 24,
      }}>
        DPIIT Recognised Startup &middot; syrka.co
      </p>
    </div>
  )
}
