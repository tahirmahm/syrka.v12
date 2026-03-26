'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import RoleSelector from '@/components/layout/RoleSelector'
import InstitutionSelector from '@/components/university/InstitutionSelector'
import ProgrammeAlignmentTable from '@/components/university/ProgrammeAlignmentTable'
import type { Institution, Programme } from '@/lib/types'

const ACCENT: Record<string, string> = {
  malta: '#1B6B5A',
  saudi: '#C9A84C',
}

export default function UniversityDashboard() {
  const params = useParams()
  const country = params.country as string
  const accentColor = ACCENT[country] || '#C9A84C'

  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('')
  const [programmes, setProgrammes] = useState<Programme[]>([])
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

  if (loading) {
    return (
      <div className="p-8">
        <RoleSelector role="University" accentColor={accentColor} />
        <div className="mt-8 animate-pulse-subtle">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <RoleSelector role="University" accentColor={accentColor} />

      <div className="mt-6">
        <h1 className="font-display text-3xl text-[#0A1628]">Institution & Programme Alignment</h1>
        <p className="text-[#5A6478] mt-1 text-sm">
          Measuring educational output against national vision workforce requirements
        </p>
      </div>

      <div className="mt-8">
        <InstitutionSelector
          institutions={institutions}
          selectedId={selectedInstitutionId}
          onSelect={setSelectedInstitutionId}
        />
      </div>

      {selectedInstitution && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
            <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Students Enrolled</p>
            <p className="font-display text-2xl mt-1">{selectedInstitution.student_count?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
            <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Annual Graduates</p>
            <p className="font-display text-2xl mt-1">{selectedInstitution.annual_graduate_count?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
            <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Type</p>
            <p className="font-display text-2xl mt-1 capitalize">{selectedInstitution.type}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
            <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Established</p>
            <p className="font-display text-2xl mt-1">{selectedInstitution.established_year}</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <ProgrammeAlignmentTable
          programmes={programmes}
          accentColor={accentColor}
        />
      </div>
    </div>
  )
}
