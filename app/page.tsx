import Link from 'next/link'
import { createClient } from '@/lib/supabase'

async function getVisions() {
  const supabase = createClient()
  const { data } = await supabase
    .from('national_visions')
    .select('*')
    .order('country')
  return data || []
}

async function getStats(visionId: string) {
  const supabase = createClient()
  const { data: sectors } = await supabase
    .from('sectors')
    .select('current_workforce, target_workforce')
    .eq('vision_id', visionId)

  const { count: institutionCount } = await supabase
    .from('institutions')
    .select('*', { count: 'exact', head: true })
    .eq('vision_id', visionId)

  const totalGap = sectors?.reduce((sum, s) => sum + (s.target_workforce - s.current_workforce), 0) || 0
  const sectorCount = sectors?.length || 0

  return { totalGap, sectorCount, institutionCount: institutionCount || 0 }
}

function formatGap(gap: number): string {
  if (gap >= 1_000_000) return `${(gap / 1_000_000).toFixed(2)}M`
  if (gap >= 1_000) return `${(gap / 1_000).toFixed(1)}K`
  return gap.toLocaleString()
}

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const visions = await getVisions()

  const maltaVision = visions.find(v => v.slug === 'malta')
  const saudiVision = visions.find(v => v.slug === 'saudi')

  const maltaStats = maltaVision ? await getStats(maltaVision.id) : null
  const saudiStats = saudiVision ? await getStats(saudiVision.id) : null

  return (
    <div className="min-h-screen flex flex-col">
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center py-8">
        <div className="text-center">
          <h1 className="font-display text-4xl text-white tracking-wide">SYRKA</h1>
          <p className="text-white/60 text-sm tracking-[0.2em] uppercase mt-1">
            National Human Capital Intelligence Platform
          </p>
        </div>
      </header>

      <div className="flex flex-1 min-h-screen">
        {/* Malta */}
        <Link
          href="/malta/ministry"
          className="group relative flex-1 flex items-center justify-center overflow-hidden transition-all duration-500 hover:flex-[1.15]"
          style={{ backgroundColor: '#0E2D26' }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(27,107,90,0.3) 0%, transparent 70%)',
            }}
          />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative z-10 text-center px-8 max-w-md">
            <div className="inline-block px-3 py-1 rounded border border-[#1B6B5A]/40 text-[#1B6B5A] text-xs tracking-widest uppercase mb-6">
              Republic of Malta
            </div>
            <h2 className="font-display text-5xl text-white mb-3">Vision 2050</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-10">
              {maltaVision?.description || 'Long-term strategy to transform into a high-value knowledge economy'}
            </p>
            {maltaStats && (
              <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
                <div>
                  <p className="font-display text-2xl text-[#1B6B5A]">{formatGap(maltaStats.totalGap)}</p>
                  <p className="text-white/40 text-xs mt-1">Workers Gap</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-[#1B6B5A]">{maltaStats.sectorCount}</p>
                  <p className="text-white/40 text-xs mt-1">Sectors</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-[#1B6B5A]">{maltaStats.institutionCount}</p>
                  <p className="text-white/40 text-xs mt-1">Institutions</p>
                </div>
              </div>
            )}
            <div className="mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="inline-flex items-center gap-2 text-[#1B6B5A] text-sm">
                Enter Dashboard
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>
          </div>
        </Link>

        <div className="w-px bg-white/10 relative z-10" />

        {/* Saudi Arabia */}
        <Link
          href="/saudi/ministry"
          className="group relative flex-1 flex items-center justify-center overflow-hidden transition-all duration-500 hover:flex-[1.15]"
          style={{ backgroundColor: '#0A1628' }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.15) 0%, transparent 70%)' }}
          />
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M40 0L60 20L40 40L20 20z M0 40L20 60L0 80z M80 40L60 60L80 80z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative z-10 text-center px-8 max-w-md">
            <div className="inline-block px-3 py-1 rounded border border-[#C9A84C]/40 text-[#C9A84C] text-xs tracking-widest uppercase mb-6">
              Kingdom of Saudi Arabia
            </div>
            <h2 className="font-display text-5xl text-white mb-3">Vision 2030</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-10">
              {saudiVision?.description || 'Transformational programme to diversify the economy and create one million new jobs'}
            </p>
            {saudiStats && (
              <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
                <div>
                  <p className="font-display text-2xl text-[#C9A84C]">{formatGap(saudiStats.totalGap)}</p>
                  <p className="text-white/40 text-xs mt-1">Workers Gap</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-[#C9A84C]">{saudiStats.sectorCount}</p>
                  <p className="text-white/40 text-xs mt-1">Sectors</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-[#C9A84C]">{saudiStats.institutionCount}</p>
                  <p className="text-white/40 text-xs mt-1">Institutions</p>
                </div>
              </div>
            )}
            <div className="mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="inline-flex items-center gap-2 text-[#C9A84C] text-sm">
                Enter Dashboard
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>
          </div>
        </Link>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 z-20 text-center py-6 space-y-3">
        <p className="text-white/25 text-[13px] max-w-2xl mx-auto leading-relaxed px-4">
          The only national human capital intelligence platform that connects government Vision targets to workforce reality — grounded in OECD, World Bank, ILO, UNESCO, ESCO, and WEF data.
        </p>
        <p className="text-white/20 text-[13px]">
          No conflict of interest. We do not run the rankings we help you improve.
        </p>
        <div className="flex items-center justify-center gap-4 text-white/20 text-[10px] tracking-wider">
          <span>World Bank</span>
          <span className="w-px h-2.5 bg-white/10" />
          <span>ILO</span>
          <span className="w-px h-2.5 bg-white/10" />
          <span>OECD</span>
          <span className="w-px h-2.5 bg-white/10" />
          <span>UNESCO</span>
          <span className="w-px h-2.5 bg-white/10" />
          <span>QS Rankings</span>
          <span className="w-px h-2.5 bg-white/10" />
          <span>THE Rankings</span>
          <span className="w-px h-2.5 bg-white/10" />
          <span>ESCO</span>
          <span className="w-px h-2.5 bg-white/10" />
          <span>Wikidata</span>
        </div>
      </footer>
    </div>
  )
}
