'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import Shell from '@/components/Shell'
import TalentPipelineHealth from '@/components/employer/TalentPipelineHealth'
import SkillDemandSignals from '@/components/employer/SkillDemandSignals'
import NationalShortageAlerts from '@/components/employer/NationalShortageAlerts'
import type { Employer, Skill } from '@/lib/types'

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

export default function EmployerDashboard() {
  const params = useParams()
  const country = params.country as string
  const accentColor = ACCENTS[country] || '#C9A84C'

  const [employers, setEmployers] = useState<Employer[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient()
      const { data: vision } = await supabase
        .from('national_visions')
        .select('id')
        .eq('slug', country)
        .single()

      if (!vision) { setLoading(false); return }

      const { data: empData } = await supabase
        .from('employers')
        .select('*, sectors(name)')
        .eq('vision_id', vision.id)
        .order('open_roles', { ascending: false })

      if (empData) setEmployers(empData)

      const { data: skillData } = await supabase
        .from('skills')
        .select('*')
        .eq('vision_id', vision.id)
        .order('gap_score', { ascending: false })

      if (skillData) setSkills(skillData)
      setLoading(false)
    }
    loadData()
  }, [country])

  return (
    <Shell country={country} activeTrack="employer">
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
          Talent Pipeline &amp; Demand Intelligence
        </h1>
        <p className="label-caps" style={{ marginTop: 3 }}>
          {COUNTRY_LABEL[country] || country} &middot; Employer Track
        </p>
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
            <NationalShortageAlerts skills={skills} accentColor={accentColor} />

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
              gap: 16,
              marginTop: 20,
            }}>
              <TalentPipelineHealth
                employers={employers}
                skills={skills}
                accentColor={accentColor}
              />
              <SkillDemandSignals
                skills={skills}
                accentColor={accentColor}
              />
            </div>
          </>
        )}
      </div>
    </Shell>
  )
}
