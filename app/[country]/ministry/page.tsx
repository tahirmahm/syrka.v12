'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import Shell from '@/components/Shell'
import VisionGapHero from '@/components/ministry/VisionGapHero'
import PolicyInterventionSimulator from '@/components/ministry/PolicyInterventionSimulator'
import PolicyBriefGenerator from '@/components/ministry/PolicyBriefGenerator'
import SectorPanel from '@/components/ministry/SectorPanel'
import InternationalBenchmarking from '@/components/ministry/InternationalBenchmarking'
import PrescriptionEngine from '@/components/ministry/PrescriptionEngine'
import SyrkaScoreWidget from '@/components/ministry/SyrkaScoreWidget'
import PolicyBriefExport from '@/components/ministry/PolicyBriefExport'
import type { Sector, Skill } from '@/lib/types'

interface SimTrajectoryPoint {
  year: number
  current_trajectory: number | null
  vision_target: number | null
  with_intervention: number | null
  data_type: 'historical' | 'projected' | null
}

const COUNTRY_LABEL: Record<string, string> = { saudi: 'Saudi Arabia', malta: 'Malta', uk: 'United Kingdom' }
const VISION_LABEL: Record<string, string> = { saudi: 'Saudi Vision 2030', malta: 'Malta Vision 2050', uk: 'AI Opportunities Action Plan — 2030' }

export default function MinistryDashboard() {
  const params = useParams()
  const country = params.country as string

  const [visionId, setVisionId] = useState('')
  const [sectors, setSectors] = useState<Sector[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [trajectoryData, setTrajectoryData] = useState<Record<string, SimTrajectoryPoint[]>>({})
  const [selectedSectorId, setSelectedSectorId] = useState('')
  const [loading, setLoading] = useState(true)
  const [simulationTrajectory, setSimulationTrajectory] = useState<SimTrajectoryPoint[] | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'benchmarking'>('overview')

  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient()
      const { data: vision } = await supabase.from('national_visions').select('*').eq('slug', country).single()
      if (!vision) { setLoading(false); return }
      setVisionId(vision.id)
      const { data: sectorData } = await supabase.from('sectors').select('*').eq('vision_id', vision.id).order('priority_score', { ascending: false })
      if (sectorData) { setSectors(sectorData); if (sectorData.length > 0) setSelectedSectorId(sectorData[0].id) }
      const { data: skillData } = await supabase.from('skills').select('*').eq('vision_id', vision.id).order('gap_score', { ascending: false })
      if (skillData) setSkills(skillData)
      const { data: trajData } = await supabase.from('trajectory_points').select('*, sectors(name)').eq('vision_id', vision.id).order('year')
      if (trajData) {
        const grouped: Record<string, SimTrajectoryPoint[]> = {}
        trajData.forEach((tp) => {
          const tpRecord = tp as Record<string, unknown>
          const sectorObj = tpRecord.sectors as { name: string } | null
          const sectorName = sectorObj?.name || 'Unknown'
          if (!grouped[sectorName]) grouped[sectorName] = []
          grouped[sectorName].push(tp as unknown as SimTrajectoryPoint)
        })
        setTrajectoryData(grouped)
      }
      setLoading(false)
    }
    loadData()
  }, [country])

  const selectedSector = sectors.find(s => s.id === selectedSectorId)
  const sectorSkills = skills.filter(s => s.sector_id === selectedSectorId)
  const totalGap = sectors.reduce((sum, s) => s.target_workforce - s.current_workforce + sum, 0)

  function formatGap(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return n.toLocaleString()
  }

  return (
    <Shell country={country} activeTrack="ministry">
      <div className="overflow-y-auto px-6 md:px-12 pb-16 pt-12" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Hero */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 pt-8">
            <div>
              <div className="badge-live mb-4">
                <span className="w-2 h-2 bg-primary animate-pulse block" />
                Live Telemetry Active
              </div>
              <h1 className="font-headline text-display-sm font-bold tracking-tighter text-primary leading-tight">
                National Workforce<br/>Gap Analysis
              </h1>
              <p className="font-body text-on-surface-variant text-lg mt-4 max-w-2xl">
                Strategic human capital intelligence for {VISION_LABEL[country] || 'National Vision'}.
                High-level policy intervention models initialized.
              </p>
            </div>
            <div className="flex gap-4 shrink-0">
              <PolicyBriefExport country={country} accentColor="#FFFFFF" hasPrescriptions={true} />
              <SyrkaScoreWidget country={country} accentColor="#FFFFFF" />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-8 w-64" />
              <div className="skeleton h-[300px]" />
            </div>
          ) : (
            <>
              {/* KPI Bento */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-surface-container-low p-6 md:p-8 flex flex-col justify-between min-h-[180px]">
                  <div>
                    <div className="font-label text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Aggregate Talent Deficit</div>
                    <div className="font-headline text-4xl md:text-5xl text-primary tracking-tighter">-{formatGap(totalGap)}</div>
                  </div>
                  <div className="flex items-center gap-2 text-error mt-4">
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>trending_down</span>
                    <span className="font-body text-sm">Off Vision Track</span>
                  </div>
                </div>
                <div className="col-span-2 bg-surface-container-low p-6 md:p-8 flex flex-col min-h-[180px]">
                  <div className="font-label text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Multi-Year Trajectory</div>
                  <div className="flex-1 min-h-[100px] overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div style={{ minWidth: 400 }}>
                      <VisionGapHero sectors={sectors} trajectoryData={trajectoryData} accentColor="#FFFFFF" country={country}
                        selectedSectorId={selectedSectorId} onSectorChange={setSelectedSectorId} simulationTrajectory={simulationTrajectory} />
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-low p-6 md:p-8 flex flex-col justify-between min-h-[180px]">
                  <div>
                    <div className="font-label text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Sectors Tracked</div>
                    <div className="font-headline text-4xl md:text-5xl text-primary tracking-tighter">{sectors.length}</div>
                  </div>
                  <div className="h-px w-full bg-primary mt-4" />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-surface-container">
                {[
                  { id: 'overview', label: `${COUNTRY_LABEL[country] || country} — Workforce Overview` },
                  { id: 'benchmarking', label: `${COUNTRY_LABEL[country] || country} — International Benchmarking` },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as 'overview' | 'benchmarking')}
                    className={`font-body text-sm pb-3 transition-colors ${activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', minHeight: 44, WebkitTapHighlightColor: 'transparent' }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-8 space-y-6">
                    {selectedSector && <SectorPanel sector={selectedSector} skills={sectorSkills} accentColor="#FFFFFF" />}
                    {selectedSector && <PolicyBriefGenerator visionSlug={country} sectorId={selectedSectorId} sectorName={selectedSector.name} accentColor="#FFFFFF" />}
                    {selectedSector && <PrescriptionEngine country={country} sector={{ id: selectedSector.id, name: selectedSector.name, current_workforce: selectedSector.current_workforce, target_workforce: selectedSector.target_workforce, target_year: selectedSector.target_year }} accentColor="#FFFFFF" />}
                  </div>
                  <div className="md:col-span-4">
                    {selectedSector && <PolicyInterventionSimulator sector={selectedSector} accentColor="#FFFFFF" visionId={visionId} onSimulationResult={t => setSimulationTrajectory(t)} />}
                  </div>
                </div>
              ) : (
                <InternationalBenchmarking country={country} accentColor="#FFFFFF" />
              )}
            </>
          )}

          {/* Data attribution */}
          <div className="border-t border-surface-container pt-6 flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
            <div className="flex flex-wrap gap-4">
              {['World Bank', 'ILO', 'OECD', 'UNESCO', 'ESCO', 'WEF', 'QS', 'THE'].map(s => (
                <span key={s} className="text-[9px] font-label uppercase tracking-widest text-outline">{s}</span>
              ))}
            </div>
            <span className="text-[10px] font-body text-outline italic">No conflict of interest — we do not run the rankings we help you improve.</span>
          </div>
        </div>
      </div>
    </Shell>
  )
}
