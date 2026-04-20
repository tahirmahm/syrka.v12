'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import Shell from '@/components/Shell'
import InstitutionSelector from '@/components/university/InstitutionSelector'
import ProgrammeAlignmentTable from '@/components/university/ProgrammeAlignmentTable'
import RankingsIntelligence from '@/components/university/RankingsIntelligence'
import type { Institution, Programme } from '@/lib/types'

const COUNTRY_LABEL: Record<string, string> = {
  saudi: 'Saudi Arabia',
  malta: 'Malta',
  uk: 'United Kingdom',
}

export default function UniversityDashboard() {
  const params = useParams()
  const country = params.country as string

  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('')
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'alignment' | 'rankings'>('alignment')

  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient()
      const { data: vision } = await supabase
        .from('national_visions')
        .select('id')
        .eq('slug', country)
        .single()

      if (!vision) { setLoading(false); return }

      const { data: instData } = await supabase
        .from('institutions')
        .select('*')
        .eq('vision_id', vision.id)
        .order('national_ranking')

      if (instData && instData.length > 0) {
        setInstitutions(instData)
        setSelectedInstitutionId(instData[0].id)
      }
      setLoading(false)
    }
    loadData()
  }, [country])

  useEffect(() => {
    if (!selectedInstitutionId) return
    async function loadProgrammes() {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from('programmes')
        .select('*')
        .eq('institution_id', selectedInstitutionId)
        .order('name')

      if (data) setProgrammes(data)
    }
    loadProgrammes()
  }, [selectedInstitutionId])

  const selectedInstitution = institutions.find(i => i.id === selectedInstitutionId)

  return (
    <Shell country={country} activeTrack="university">
      <div className="overflow-y-auto px-6 md:px-12 pb-16 pt-12" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Hero */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 pt-8">
            <div>
              <div className="badge-live mb-4">
                <span className="w-2 h-2 bg-primary animate-pulse block" />
                Institution Intelligence Active
              </div>
              <h1 className="font-headline text-display-sm font-bold tracking-tighter text-primary leading-tight">
                Institution &amp; Programme<br/>Intelligence
              </h1>
              <p className="font-body text-on-surface-variant text-lg mt-4 max-w-2xl">
                {COUNTRY_LABEL[country] || country} — University Track. Graduate employment velocity, curriculum alignment, and strategic sector positioning.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-8 w-64" />
              <div className="skeleton h-[300px]" />
            </div>
          ) : (
            <>
              {/* Institution selector */}
              <div className="mb-6">
                <InstitutionSelector
                  institutions={institutions}
                  selectedId={selectedInstitutionId}
                  onSelect={setSelectedInstitutionId}
                />
              </div>

              {/* KPI Bento */}
              {selectedInstitution && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Students Enrolled', value: selectedInstitution.student_count?.toLocaleString() || '—' },
                    { label: 'Annual Graduates', value: selectedInstitution.annual_graduate_count?.toLocaleString() || '—' },
                    { label: 'Type', value: selectedInstitution.type || '—' },
                    { label: 'Established', value: String(selectedInstitution.established_year || '—') },
                  ].map(stat => (
                    <div key={stat.label} className="bg-surface-container-low p-6 md:p-8 flex flex-col justify-between min-h-[140px]">
                      <div className="font-label text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">{stat.label}</div>
                      <div className="font-headline text-3xl md:text-4xl text-primary tracking-tighter capitalize">{stat.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-6 border-b border-surface-container">
                {[
                  { id: 'alignment', label: `${COUNTRY_LABEL[country] || country} — Programme Alignment` },
                  { id: 'rankings', label: `${COUNTRY_LABEL[country] || country} — Rankings Intelligence` },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as 'alignment' | 'rankings')}
                    className={`font-body text-sm pb-3 transition-colors ${activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', minHeight: 44, WebkitTapHighlightColor: 'transparent' }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'alignment' ? (
                <ProgrammeAlignmentTable
                  programmes={programmes}
                  accentColor="#FFFFFF"
                />
              ) : (
                selectedInstitution && (
                  <RankingsIntelligence
                    institutionName={selectedInstitution.name}
                    accentColor="#FFFFFF"
                    country={country}
                  />
                )
              )}
            </>
          )}

          {/* Data attribution */}
          <div className="border-t border-surface-container pt-6 flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
            <div className="flex flex-wrap gap-4">
              {['QS', 'THE', 'ESCO', 'UNESCO', 'OECD'].map(s => (
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
