'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import Shell from '@/components/Shell'
import TalentPipelineHealth from '@/components/employer/TalentPipelineHealth'
import SkillDemandSignals from '@/components/employer/SkillDemandSignals'
import NationalShortageAlerts from '@/components/employer/NationalShortageAlerts'
import type { Employer, Skill } from '@/lib/types'

const COUNTRY_LABEL: Record<string, string> = {
  saudi: 'Saudi Arabia',
  malta: 'Malta',
  uk: 'United Kingdom',
}

export default function EmployerDashboard() {
  const params = useParams()
  const country = params.country as string

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

  const totalOpenRoles = employers.reduce((sum, e) => sum + (e.open_roles || 0), 0)
  const criticalSkills = skills.filter(s => s.gap_score >= 7).length

  return (
    <Shell country={country} activeTrack="employer">
      <div className="overflow-y-auto px-6 md:px-12 pb-16 pt-12" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Hero */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 pt-8">
            <div>
              <div className="badge-live mb-4">
                <span className="w-2 h-2 bg-primary animate-pulse block" />
                Demand Signals Active
              </div>
              <h1 className="font-headline text-display-sm font-bold tracking-tighter text-primary leading-tight">
                Talent Pipeline &amp;<br/>Demand Intelligence
              </h1>
              <p className="font-body text-on-surface-variant text-lg mt-4 max-w-2xl">
                {COUNTRY_LABEL[country] || country} — Employer Track. Workforce productivity signals, skill demand mapping, and pipeline health analysis.
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
              {/* KPI Bento */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-surface-container-low p-6 md:p-8 flex flex-col justify-between min-h-[160px]">
                  <div className="font-label text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Employers Tracked</div>
                  <div className="font-headline text-4xl md:text-5xl text-primary tracking-tighter">{employers.length}</div>
                </div>
                <div className="bg-surface-container-low p-6 md:p-8 flex flex-col justify-between min-h-[160px]">
                  <div className="font-label text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Total Open Roles</div>
                  <div className="font-headline text-4xl md:text-5xl text-primary tracking-tighter">{totalOpenRoles.toLocaleString()}</div>
                </div>
                <div className="bg-surface-container-low p-6 md:p-8 flex flex-col justify-between min-h-[160px]">
                  <div className="font-label text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Skills Monitored</div>
                  <div className="font-headline text-4xl md:text-5xl text-primary tracking-tighter">{skills.length}</div>
                </div>
                <div className="bg-surface-container-low p-6 md:p-8 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <div className="font-label text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Critical Gaps</div>
                    <div className="font-headline text-4xl md:text-5xl text-primary tracking-tighter">{criticalSkills}</div>
                  </div>
                  <div className="flex items-center gap-2 text-error mt-4">
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>warning</span>
                    <span className="font-body text-sm">Immediate Action</span>
                  </div>
                </div>
              </div>

              {/* Shortage alerts */}
              <NationalShortageAlerts skills={skills} accentColor="#FFFFFF" />

              {/* Two-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TalentPipelineHealth
                  employers={employers}
                  skills={skills}
                  accentColor="#FFFFFF"
                />
                <SkillDemandSignals
                  skills={skills}
                  accentColor="#FFFFFF"
                />
              </div>
            </>
          )}

          {/* Data attribution */}
          <div className="border-t border-surface-container pt-6 flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
            <div className="flex flex-wrap gap-4">
              {['ILO', 'OECD', 'ESCO', 'WEF'].map(s => (
                <span key={s} className="text-[9px] font-label uppercase tracking-widest text-outline">{s}</span>
              ))}
            </div>
            <span className="text-[10px] font-body text-outline italic">Real-time demand signal aggregation across employer networks.</span>
          </div>
        </div>
      </div>
    </Shell>
  )
}
