import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const COUNTRIES = [
  {
    slug: 'malta',
    label: 'Republic of Malta',
    name: 'Malta',
    visionName: 'Vision 2050',
    targetYear: 2050,
    accent: '#1B6B5A',
    bg: '#0E2D26',
    fallbackGap: '81.2K',
    fallbackSectors: 5,
    fallbackInstitutions: 3,
    gapLabel: 'Workers Gap',
    description: 'Long-term strategy to transform into a high-value knowledge economy',
  },
  {
    slug: 'saudi',
    label: 'Kingdom of Saudi Arabia',
    name: 'Saudi Arabia',
    visionName: 'Vision 2030',
    targetYear: 2030,
    accent: '#C9A84C',
    bg: '#0A1628',
    fallbackGap: '2.19M',
    fallbackSectors: 6,
    fallbackInstitutions: 5,
    gapLabel: 'Workers Gap',
    description: 'Transformational programme to diversify the economy and create one million new jobs',
  },
  {
    slug: 'uk',
    label: 'United Kingdom',
    name: 'United Kingdom',
    visionName: 'AI Opportunities Action Plan',
    targetYear: 2030,
    accent: '#1a3a6b',
    bg: '#0c1a2e',
    fallbackGap: '9.0M',
    fallbackSectors: 6,
    fallbackInstitutions: 7,
    gapLabel: 'Workers to Upskill',
    description: 'Upskill 10 million workers in AI by 2030, unlocking £140 billion in annual economic output',
  },
]

async function getVisionStats() {
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
}

function formatGap(gap: number): string {
  if (gap >= 1_000_000) return `${(gap / 1_000_000).toFixed(gap >= 10_000_000 ? 1 : 2)}M`
  if (gap >= 1_000) return `${(gap / 1_000).toFixed(1)}K`
  return gap.toLocaleString()
}

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const stats = await getVisionStats()

  return (
    <div className="min-h-screen flex flex-col bg-[#060e1a]">
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6">
        <div>
          <h1 className="font-display text-3xl text-white tracking-wide">SYRKA</h1>
          <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase mt-0.5">
            National Human Capital Intelligence
          </p>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/sovereign" className="text-white/40 text-sm hover:text-white/70 transition-colors">About</Link>
        </nav>
      </header>

      {/* Hero */}
      <div className="relative z-10 text-center px-8 pt-8 pb-6 max-w-3xl mx-auto">
        <h2 className="font-display text-[2.5rem] leading-[1.15] text-white">
          From National Vision to Human Capital Reality.
        </h2>
        <p className="text-white/50 text-[15px] leading-relaxed mt-4 max-w-xl mx-auto">
          The only platform that connects government skill targets to workforce intelligence — with no conflict of interest in the rankings it benchmarks.
        </p>
        <p className="text-white/30 text-[13px] mt-3 max-w-lg mx-auto leading-relaxed">
          No conflict of interest — we do not run the rankings we help you improve.
          Unlike QS&apos;s own advisory arm, flagged by the UN University Institute in 2023,
          Syrka&apos;s recommendations are grounded in OECD and ESCO data.
        </p>
      </div>

      {/* Country Cards */}
      <div className="flex-1 flex flex-col lg:flex-row gap-px px-4 pb-4 min-h-[420px]">
        {COUNTRIES.map((c) => {
          const s = stats[c.slug]
          const gap = s ? formatGap(s.totalGap) : c.fallbackGap
          const sectors = s?.sectorCount || c.fallbackSectors
          const institutions = s?.institutionCount || c.fallbackInstitutions

          return (
            <Link
              key={c.slug}
              href={`/${c.slug}/ministry`}
              className="group relative flex-1 flex items-center justify-center overflow-hidden rounded-lg transition-all duration-500 hover:flex-[1.2]"
              style={{ backgroundColor: c.bg }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: `radial-gradient(ellipse at center, ${c.accent}25 0%, transparent 70%)` }}
              />
              {/* Accent top bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: c.accent }}
              />

              <div className="relative z-10 text-center px-6 max-w-sm">
                <div
                  className="inline-block px-3 py-1 rounded border text-xs tracking-widest uppercase mb-4"
                  style={{ borderColor: `${c.accent}40`, color: c.accent, letterSpacing: '0.3px' }}
                >
                  {c.label}
                </div>
                <h3 className="font-display text-3xl text-white mb-2">{c.visionName}</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-8">
                  {c.description}
                </p>

                <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                  <div>
                    <p className="font-display text-xl tabular-nums" style={{ color: c.accent }}>{gap}</p>
                    <p className="text-white/35 text-[11px] mt-1 tracking-wide uppercase" style={{ letterSpacing: '0.3px' }}>{c.gapLabel}</p>
                  </div>
                  <div>
                    <p className="font-display text-xl" style={{ color: c.accent }}>{sectors}</p>
                    <p className="text-white/35 text-[11px] mt-1 tracking-wide uppercase" style={{ letterSpacing: '0.3px' }}>Sectors</p>
                  </div>
                  <div>
                    <p className="font-display text-xl" style={{ color: c.accent }}>{institutions}</p>
                    <p className="text-white/35 text-[11px] mt-1 tracking-wide uppercase" style={{ letterSpacing: '0.3px' }}>Institutions</p>
                  </div>
                </div>

                <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="inline-flex items-center gap-2 text-sm" style={{ color: c.accent }}>
                    Enter Dashboard
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Data Sources Footer */}
      <footer className="relative z-20 text-center py-6 space-y-3">
        <p className="text-white/20 text-[11px] tracking-wider uppercase" style={{ letterSpacing: '0.3px' }}>Grounded in</p>
        <div className="flex items-center justify-center gap-4 text-white/25 text-[11px] tracking-wider">
          {['World Bank', 'ILO', 'OECD', 'UNESCO', 'ESCO', 'WEF', 'QS Rankings', 'THE Rankings', 'Wikidata'].map((src, i) => (
            <span key={src} className="flex items-center gap-4">
              {i > 0 && <span className="w-px h-2.5 bg-white/10" />}
              {src}
            </span>
          ))}
        </div>
        <p className="text-white/15 text-[11px]">
          DPIIT Recognised Startup &middot; syrka.co
        </p>
      </footer>
    </div>
  )
}
