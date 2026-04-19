'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import RoleSelector from '@/components/layout/RoleSelector'
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

const ACCENT: Record<string, string> = {
  malta: '#1B6B5A',
  saudi: '#C9A84C',
  uk: '#1a3a6b',
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

export default function MinistryDashboard() {
  const params = useParams()
  const country = params.country as string
  const accentColor = ACCENT[country] || '#C9A84C'

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

  if (loading) {
    return (
      <div className="p-8">
        <RoleSelector role="Ministry" accentColor={accentColor} />
        <div className="mt-8 animate-pulse-subtle">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-[340px] bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <RoleSelector role="Ministry" accentColor={accentColor} />

      <div className="mt-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl text-[#0A1628]">National Workforce Gap Overview</h1>
          <p className="text-[#5A6478] mt-1 text-sm">
            Strategic human capital intelligence for {VISION_LABEL[country] || 'National Vision'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <PolicyBriefExport country={country} accentColor={accentColor} hasPrescriptions={true} />
          <SyrkaScoreWidget country={country} accentColor={accentColor} />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mt-6 flex gap-1 border-b border-[#E2E5EB]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'overview'
              ? 'text-[#0A1628]'
              : 'text-[#8B95A8] hover:text-[#5A6478]'
          }`}
        >
          {COUNTRY_LABEL[country] || country} — Workforce Overview
          {activeTab === 'overview' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: accentColor }} />
          )}
        </button>
        <button
          onClick={() => setActiveTab('benchmarking')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'benchmarking'
              ? 'text-[#0A1628]'
              : 'text-[#8B95A8] hover:text-[#5A6478]'
          }`}
        >
          {COUNTRY_LABEL[country] || country} — International Benchmarking
          {activeTab === 'benchmarking' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: accentColor }} />
          )}
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          <div className="mt-8">
            <VisionGapHero
              sectors={sectors}
              trajectoryData={trajectoryData}
              accentColor={accentColor}
              country={country}
              selectedSectorId={selectedSectorId}
              onSectorChange={setSelectedSectorId}
              simulationTrajectory={simulationTrajectory}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
            <div className="xl:col-span-2 space-y-6">
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
        <div className="mt-8">
          <InternationalBenchmarking country={country} accentColor={accentColor} />
        </div>
      )}

      {/* Data Source Footer */}
      <footer className="mt-12 pt-6 border-t border-[#E2E5EB]">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8B95A8]">
          <span className="uppercase tracking-wider font-medium">Data sources</span>
          {['World Bank', 'ILO', 'OECD', 'UNESCO', 'WEF', 'ESCO'].map((src, i) => (
            <span key={src} className="flex items-center gap-3">
              {i > 0 && <span className="w-px h-3 bg-[#E2E5EB]" />}
              {src}
            </span>
          ))}
        </div>
      </footer>
    </div>
  )
}
