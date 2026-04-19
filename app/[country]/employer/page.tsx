'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import RoleSelector from '@/components/layout/RoleSelector'
import TalentPipelineHealth from '@/components/employer/TalentPipelineHealth'
import SkillDemandSignals from '@/components/employer/SkillDemandSignals'
import NationalShortageAlerts from '@/components/employer/NationalShortageAlerts'
import type { Employer, Skill } from '@/lib/types'

const ACCENT: Record<string, string> = {
  malta: '#1B6B5A',
  saudi: '#C9A84C',
  uk: '#1a3a6b',
}

export default function EmployerDashboard() {
  const params = useParams()
  const country = params.country as string
  const accentColor = ACCENT[country] || '#C9A84C'

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

  if (loading) {
    return (
      <div className="p-8">
        <RoleSelector role="Employer" accentColor={accentColor} />
        <div className="mt-8 animate-pulse-subtle">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <RoleSelector role="Employer" accentColor={accentColor} />

      <div className="mt-6">
        <h1 className="font-display text-3xl text-[#0A1628]">Talent Pipeline & Demand Intelligence</h1>
        <p className="text-[#5A6478] mt-1 text-sm">
          Real-time workforce demand signals and pipeline health indicators
        </p>
      </div>

      <div className="mt-8">
        <NationalShortageAlerts skills={skills} accentColor={accentColor} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
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
    </div>
  )
}
