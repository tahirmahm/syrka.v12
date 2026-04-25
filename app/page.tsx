import { createClient } from '@/lib/supabase'

async function getVisionStats() {
  try {
    const supabase = createClient()
    const { data: visions } = await supabase.from('national_visions').select('*').order('country')
    const stats: Record<string, { totalGap: number; sectorCount: number; institutionCount: number }> = {}
    for (const v of visions || []) {
      const { data: sectors } = await supabase.from('sectors').select('current_workforce, target_workforce').eq('vision_id', v.id)
      const { count } = await supabase.from('institutions').select('*', { count: 'exact', head: true }).eq('vision_id', v.id)
      const totalGap = sectors?.reduce((sum, s) => sum + (s.target_workforce - s.current_workforce), 0) || 0
      stats[v.slug] = { totalGap, sectorCount: sectors?.length || 0, institutionCount: count || 0 }
    }
    return stats
  } catch { return {} }
}

function formatGap(gap: number): string {
  if (gap >= 1_000_000) return `${(gap / 1_000_000).toFixed(gap >= 10_000_000 ? 1 : 2)}M`
  if (gap >= 1_000) return `${(gap / 1_000).toFixed(1)}K`
  return gap.toLocaleString()
}

const COUNTRIES = [
  { slug: 'saudi', code: 'SAU', name: 'KINGDOM OF\nSAUDI ARABIA', vision: 'VISION_2030', desc: 'Saudi Vision 2030 — national economic diversification and human capital transformation.', fallbackGap: '2.19M', gapLabel: 'Workers Gap', bg: 'bg-background' },
  { slug: 'malta', code: 'MLT', name: 'REPUBLIC\nOF MALTA', vision: 'VISION_2050', desc: 'Malta Vision 2050 — digital economy transformation and knowledge sector leadership.', fallbackGap: '81.2K', gapLabel: 'Workers Gap', bg: 'bg-surface-container-low' },
  { slug: 'uk', code: 'GBR', name: 'UNITED\nKINGDOM', vision: 'AI_ACTION_PLAN', desc: 'AI Opportunities Action Plan — 10 million workers upskilled by 2030.', fallbackGap: '9.0M', gapLabel: 'Workers to Upskill', bg: 'bg-surface-container' },
]

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const stats = await getVisionStats()

  return (
    <div className="min-h-[100dvh] bg-background text-on-background">

      {/* Fixed nav */}
      <nav className="nav-glass fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-5 ghost-border">
        <a href="/" className="text-xl font-headline font-bold text-primary" style={{ letterSpacing: '0.35em', textDecoration: 'none' }}>SYRKA</a>
        <div className="hidden md:flex gap-10 items-center">
          {['Intelligence', 'Infrastructure', 'Partners', 'Data'].map((item, i) => (
            <span key={item} className={`font-label text-[11px] uppercase tracking-widest transition-colors cursor-pointer ${i === 3 ? 'text-primary border-b border-primary pb-1' : 'text-on-surface-variant hover:text-primary'}`}>
              {item}
            </span>
          ))}
        </div>
        <a href="/saudi/ministry" className="btn-primary text-[10px]" style={{ textDecoration: 'none' }}>Access Portal</a>
      </nav>

      <main className="pt-40">

        {/* Hero */}
        <section className="px-8 md:px-16 mb-32 grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-9">
            <div className="flex items-center gap-4 mb-8">
              <span className="w-8 h-px bg-primary block" />
              <span className="font-label text-[10px] tracking-ultra uppercase text-on-surface-variant">
                National Human Capital Intelligence
              </span>
            </div>
            <h1 className="text-display-lg font-headline font-bold mb-10">
              DATA FOR<br/>HUMAN<br/>CAPITAL.
            </h1>
            <p className="text-on-surface-variant font-body max-w-2xl leading-relaxed text-xl">
              Syrka connects national Vision targets to workforce reality across four tracks:
              Ministry, University, Employer, and Student.
            </p>
          </div>
          <div className="md:col-span-3 flex flex-col items-end gap-3 text-right pt-24">
            <span className="font-headline font-light tracking-widest opacity-20 text-3xl">0000 // 1111</span>
            <span className="text-[10px] font-body uppercase tracking-[0.2em] text-outline">
              CORE.INTELLIGENCE.ACTIVE
            </span>
          </div>
        </section>

        {/* Bento grid — country cards */}
        <section className="px-8 md:px-16 mb-40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-outline-variant">
            {COUNTRIES.map(c => {
              const s = stats[c.slug]
              const gap = s ? formatGap(s.totalGap) : c.fallbackGap
              return (
                <a key={c.slug} href={`/${c.slug}/ministry`}
                   className={`${c.bg} p-10 flex flex-col justify-between group hover:bg-surface-container-high transition-colors duration-300 min-h-[320px]`}
                   style={{ textDecoration: 'none' }}>
                  <div>
                    <div className="flex justify-between items-start mb-8">
                      <span className="font-label text-[9px] uppercase tracking-widest text-outline">{c.vision}{' // '}{c.code}</span>
                      <span className="material-symbols-outlined text-outline text-2xl">arrow_outward</span>
                    </div>
                    <h3 className="text-3xl font-headline font-bold tracking-tighter mb-4 text-primary whitespace-pre-line">{c.name}</h3>
                    <p className="text-sm font-body text-on-surface-variant leading-relaxed">{c.desc}</p>
                  </div>
                  <div className="mt-8">
                    <div className="font-headline text-4xl font-bold text-primary tracking-tighter">{gap}</div>
                    <div className="text-xs font-label uppercase tracking-widest text-on-surface-variant mt-1">{c.gapLabel}</div>
                  </div>
                </a>
              )
            })}
          </div>
        </section>

        {/* Stats strip */}
        <section className="px-8 md:px-16 mb-40 grid grid-cols-2 md:grid-cols-4 gap-16">
          {[
            { value: '3', unit: 'Countries', label: 'Active Pilots' },
            { value: '9', unit: 'Data Sources', label: 'Integrated APIs' },
            { value: '27', unit: 'Scenarios', label: 'Simulation Model' },
            { value: '0', unit: 'Conflict', label: 'No Ranking Bias' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="font-headline text-5xl font-bold tracking-tighter text-primary">
                {stat.value}<span className="text-2xl text-on-surface-variant ml-1">{stat.unit}</span>
              </div>
              <div className="text-xs font-label uppercase tracking-widest text-outline mt-2">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="px-8 md:px-16 mb-40 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <h2 className="text-display-md font-headline font-bold">BUILD WITH<br/>SYRKA.</h2>
          <div className="flex flex-col gap-3">
            <p className="text-on-surface-variant font-body max-w-xs">
              No conflict of interest. We do not run the rankings we help you improve.
            </p>
            <a href="/saudi/ministry" className="btn-primary inline-flex items-center gap-2" style={{ textDecoration: 'none' }}>
              Enter Platform
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
            </a>
          </div>
        </section>

        {/* Data sources */}
        <section className="px-8 md:px-16 mb-16">
          <div className="flex flex-wrap gap-x-8 gap-y-3 items-center border-t border-surface-container pt-8">
            <span className="text-xs font-label uppercase tracking-ultra text-outline">Data Sources</span>
            {['World Bank', 'ILO', 'OECD', 'UNESCO', 'ESCO', 'WEF', 'QS Rankings', 'THE Rankings'].map(s => (
              <span key={s} className="text-xs font-body text-on-surface-variant">{s}</span>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="px-8 md:px-16 py-8 border-t border-surface-container flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <a href="/" className="font-headline font-bold text-lg text-primary" style={{ letterSpacing: '0.35em', textDecoration: 'none' }}>SYRKA</a>
          <div className="flex gap-8">
            <a href="/model-cards" className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" style={{ textDecoration: 'none' }}>Model Governance</a>
            <a href="/intelligence" className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" style={{ textDecoration: 'none' }}>Intelligence</a>
            {['Privacy', 'Legal', 'Security'].map(item => (
              <span key={item} className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors cursor-pointer">{item}</span>
            ))}
          </div>
          <div className="text-xs font-body text-outline">&copy; 2026 Syrka &middot; National Human Capital Intelligence</div>
        </footer>
      </main>
    </div>
  )
}
