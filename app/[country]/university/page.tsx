'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import Shell from '@/components/Shell'
import InstitutionSelector from '@/components/university/InstitutionSelector'
import ProgrammeAlignmentTable from '@/components/university/ProgrammeAlignmentTable'
import RankingsIntelligence from '@/components/university/RankingsIntelligence'
import type { Institution, Programme } from '@/lib/types'

const ACCENTS: Record<string, string> = {
  malta: '#1D9E75',
  saudi: '#C9A84C',
  uk: '#3B8BD4',
}

const COUNTRY_LABEL: Record<string, string> = {
  saudi: 'Saudi Arabia',
  malta: 'Malta',
  uk: 'United Kingdom',
}

export default function UniversityDashboard() {
  const params = useParams()
  const country = params.country as string
  const accentColor = ACCENTS[country] || '#C9A84C'

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
      {/* Top bar */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '0.5px solid var(--border-subtle)',
        padding: 'clamp(10px, 2vw, 14px) clamp(16px, 3vw, 24px)',
        flexShrink: 0,
      }}>
        <h1 style={{
          fontSize: 'clamp(13px, 2vw, 15px)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '0.2px',
        }}>
          Institution &amp; Programme Intelligence
        </h1>
        <p className="label-caps" style={{ marginTop: 3 }}>
          {COUNTRY_LABEL[country] || country} &middot; University Track
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '0.5px solid var(--border-subtle)',
        overflowX: 'auto',
        flexShrink: 0,
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ display: 'flex', minWidth: 'max-content', padding: '0 clamp(16px, 3vw, 24px)' }}>
          {[
            { id: 'alignment', label: 'Programme Alignment' },
            { id: 'rankings', label: 'Rankings Intelligence' },
          ].map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id as 'alignment' | 'rankings')}
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

      {/* Content */}
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
            <div className="skeleton" style={{ height: 240 }} />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <InstitutionSelector
                institutions={institutions}
                selectedId={selectedInstitutionId}
                onSelect={setSelectedInstitutionId}
              />
            </div>

            {selectedInstitution && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}>
                {[
                  { label: 'STUDENTS ENROLLED', value: selectedInstitution.student_count?.toLocaleString() || '—' },
                  { label: 'ANNUAL GRADUATES', value: selectedInstitution.annual_graduate_count?.toLocaleString() || '—' },
                  { label: 'TYPE', value: selectedInstitution.type || '—' },
                  { label: 'ESTABLISHED', value: String(selectedInstitution.established_year || '—') },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'var(--bg-surface)',
                    border: '0.5px solid var(--border-subtle)',
                    borderRadius: 'var(--r-md)',
                    padding: 'clamp(12px, 2vw, 16px)',
                  }}>
                    <div className="label-caps" style={{ marginBottom: 6 }}>{stat.label}</div>
                    <div className="num" style={{
                      fontSize: 'clamp(18px, 4vw, 22px)',
                      color: accentColor,
                      textTransform: 'capitalize',
                    }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'alignment' ? (
              <ProgrammeAlignmentTable
                programmes={programmes}
                accentColor={accentColor}
              />
            ) : (
              selectedInstitution && (
                <RankingsIntelligence
                  institutionName={selectedInstitution.name}
                  accentColor={accentColor}
                  country={country}
                />
              )
            )}
          </>
        )}
      </div>
    </Shell>
  )
}
