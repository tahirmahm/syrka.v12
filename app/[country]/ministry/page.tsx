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

const ACCENTS: Record<string, string> = {
  malta: '#1D9E75',
  saudi: '#C9A84C',
  uk: '#3B8BD4',
}

const VISION_LABEL: Record<string, string> = {
  saudi: 'Saudi Vision 2030',
  malta: 'Malta Vision 2050',
  uk: 'AI Opportunities Action Plan — 2030',
}

const COUNTRY_LABEL: Record<string, string> = {
  saudi: 'Saudi Arabia',
  malta: 'Malta',
  uk: 'United Kingdom',
}

const VISION_YEARS: Record<string, number> = {
  saudi: 2030,
  malta: 2050,
  uk: 2030,
}

export default function MinistryDashboard() {
  const params = useParams()
  const country = params.country as string
  const accentColor = ACCENTS[country] || '#C9A84C'

  const [visionId, setVisionId] = useState<string>('')
  const [sectors, setSectors] = useState<Sector[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [trajectoryData, setTrajectoryData] = useState<Record<string, SimTrajectoryPoint[]>>({})
  const [selectedSectorId, setSelectedSectorId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [simulationTrajectory, setSimulationTrajectory] = useState<SimTrajectoryPoint[] | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'benchmarking'>('overview')

  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient()

      const { data: vision } = await supabase
        .from('national_visions')
        .select('*')
        .eq('slug', country)
        .single()

      if (!vision) { setLoading(false); return }
      setVisionId(vision.id)

      const { data: sectorData } = await supabase
        .from('sectors')
        .select('*')
        .eq('vision_id', vision.id)
        .order('priority_score', { ascending: false })

      if (sectorData) {
        setSectors(sectorData)
        if (sectorData.length > 0) setSelectedSectorId(sectorData[0].id)
      }

      const { data: skillData } = await supabase
        .from('skills')
        .select('*')
        .eq('vision_id', vision.id)
        .order('gap_score', { ascending: false })

      if (skillData) setSkills(skillData)

      const { data: trajData } = await supabase
        .from('trajectory_points')
        .select('*, sectors(name)')
        .eq('vision_id', vision.id)
        .order('year')

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

  return (
    <Shell country={country} activeTrack="ministry">
      {/* Sticky top bar */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '0.5px solid var(--border-subtle)',
        padding: 'clamp(10px, 2vw, 14px) clamp(16px, 3vw, 24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(13px, 2vw, 15px)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '0.2px',
          }}>
            National Workforce Gap — Ministry
          </h1>
          <p className="label-caps" style={{ marginTop: 3 }}>
            {COUNTRY_LABEL[country] || country} &middot; {VISION_LABEL[country] || ''} &middot; {VISION_YEARS[country] || ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <SyrkaScoreWidget country={country} accentColor={accentColor} />
          <PolicyBriefExport country={country} accentColor={accentColor} hasPrescriptions={true} />
        </div>
      </div>

      {/* Sticky tabs */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '0.5px solid var(--border-subtle)',
        overflowX: 'auto',
        flexShrink: 0,
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ display: 'flex', minWidth: 'max-content', padding: '0 clamp(16px, 3vw, 24px)' }}>
          {[
            { id: 'overview', label: `${COUNTRY_LABEL[country] || country} — Workforce Overview` },
            { id: 'benchmarking', label: `${COUNTRY_LABEL[country] || country} — International Benchmarking` },
          ].map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'benchmarking')}
              style={{
                padding: '12px 16px',
                fontSize: 12,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? accentColor : 'transparent'}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: 44,
                transition: 'all var(--t-fast)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)',
        WebkitOverflowScrolling: 'touch',
      }}>
        {loading ? (
          <div style={{ padding: 40 }}>
            <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 300 }} />
          </div>
        ) : activeTab === 'overview' ? (
          <>
            <VisionGapHero
              sectors={sectors}
              trajectoryData={trajectoryData}
              accentColor={accentColor}
              country={country}
              selectedSectorId={selectedSectorId}
              onSectorChange={setSelectedSectorId}
              simulationTrajectory={simulationTrajectory}
            />

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
              gap: 16,
              marginTop: 20,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {selectedSector && (
                  <SectorPanel
                    sector={selectedSector}
                    skills={sectorSkills}
                    accentColor={accentColor}
                  />
                )}
                {selectedSector && (
                  <PolicyBriefGenerator
                    visionSlug={country}
                    sectorId={selectedSectorId}
                    sectorName={selectedSector.name}
                    accentColor={accentColor}
                  />
                )}
                {selectedSector && (
                  <PrescriptionEngine
                    country={country}
                    sector={{
                      id: selectedSector.id,
                      name: selectedSector.name,
                      current_workforce: selectedSector.current_workforce,
                      target_workforce: selectedSector.target_workforce,
                      target_year: selectedSector.target_year,
                    }}
                    accentColor={accentColor}
                  />
                )}
              </div>
              <div>
                {selectedSector && (
                  <PolicyInterventionSimulator
                    sector={selectedSector}
                    accentColor={accentColor}
                    visionId={visionId}
                    onSimulationResult={(trajectory) => setSimulationTrajectory(trajectory)}
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <InternationalBenchmarking country={country} accentColor={accentColor} />
        )}

        {/* Data footer */}
        <div style={{
          marginTop: 40,
          paddingTop: 16,
          borderTop: '0.5px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
        }}>
          <span className="label-caps">Data sources</span>
          {['World Bank', 'ILO', 'OECD', 'UNESCO', 'WEF', 'ESCO'].map(src => (
            <span key={src} style={{
              fontSize: 9,
              color: 'var(--text-faint)',
              border: '0.5px solid var(--border-subtle)',
              borderRadius: 3,
              padding: '2px 6px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              {src}
            </span>
          ))}
        </div>
      </div>
    </Shell>
  )
}
