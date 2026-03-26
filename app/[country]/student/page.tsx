'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import RoleSelector from '@/components/layout/RoleSelector'
import VisionAlignmentScore from '@/components/student/VisionAlignmentScore'
import SkillProfileMap from '@/components/student/SkillProfileMap'
import CareerPathways from '@/components/student/CareerPathways'
import type { Student, Sector } from '@/lib/types'

const ACCENT: Record<string, string> = {
  malta: '#1B6B5A',
  saudi: '#C9A84C',
}

export default function StudentDashboard() {
  const params = useParams()
  const country = params.country as string
  const accentColor = ACCENT[country] || '#C9A84C'

  const [students, setStudents] = useState<Student[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
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

      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('nationality', country === 'saudi' ? 'Saudi Arabia' : 'Malta')
        .limit(200)

      if (studentData) setStudents(studentData)

      const { data: sectorData } = await supabase
        .from('sectors')
        .select('*')
        .eq('vision_id', vision.id)
        .order('priority_score', { ascending: false })

      if (sectorData) setSectors(sectorData)
      setLoading(false)
    }
    loadData()
  }, [country])

  const skillProfiles = [
    { name: 'Digital Literacy', avgProficiency: 72 },
    { name: 'Data Analysis', avgProficiency: 58 },
    { name: 'Programming', avgProficiency: 45 },
    { name: 'Communication', avgProficiency: 78 },
    { name: 'Critical Thinking', avgProficiency: 65 },
    { name: 'Project Management', avgProficiency: 52 },
    { name: 'Domain Expertise', avgProficiency: 61 },
    { name: 'Research Methods', avgProficiency: 48 },
  ]

  const careerPathways = sectors.map(s => ({
    name: s.name,
    open_roles: s.target_workforce - s.current_workforce,
    alignment: Math.round(40 + Math.random() * 45),
  }))

  if (loading) {
    return (
      <div className="p-8">
        <RoleSelector role="Student" accentColor={accentColor} />
        <div className="mt-8 animate-pulse-subtle">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <RoleSelector role="Student" accentColor={accentColor} />

      <div className="mt-6">
        <h1 className="font-display text-3xl text-[#0A1628]">Student Cohort Intelligence</h1>
        <p className="text-[#5A6478] mt-1 text-sm">
          Vision alignment, skill profiles, and career pathway readiness
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
          <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Total Students Tracked</p>
          <p className="font-display text-3xl mt-1">{students.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
          <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Avg. Vision Alignment</p>
          <p className="font-display text-3xl mt-1">
            {students.length > 0
              ? `${Math.round(students.reduce((sum, s) => sum + (s.vision_alignment_score || 0), 0) / students.length)}%`
              : 'N/A'}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
          <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Employment Readiness</p>
          <p className="font-display text-3xl mt-1">
            {students.length > 0
              ? `${Math.round(students.reduce((sum, s) => sum + (s.employment_readiness_score || 0), 0) / students.length)}%`
              : 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
        <VisionAlignmentScore students={students} accentColor={accentColor} />
        <SkillProfileMap skills={skillProfiles} accentColor={accentColor} />
      </div>

      <div className="mt-8">
        <CareerPathways sectors={careerPathways} accentColor={accentColor} />
      </div>
    </div>
  )
}
