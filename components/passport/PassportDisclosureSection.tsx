'use client'

import { useMemo, useState } from 'react'
import { DisclosureControls } from './DisclosureControls'
import { ExternalPassportPreview } from './ExternalPassportPreview'
import { buildExternalPassportView } from '@/lib/utilities/external-passport-view'
import type { PassportVersion, DisclosureSettings, Institution, Programme, EvidenceRecord, Course } from '@/lib/campus-types'

export interface PassportDisclosureSectionProps {
  version: PassportVersion
  defaultSettings: DisclosureSettings
  institution: Institution
  programme?: Programme
  studentName: string
  evidenceRecords: EvidenceRecord[]
  courses: Course[]
}

export function PassportDisclosureSection({
  version,
  defaultSettings,
  institution,
  programme,
  studentName,
  evidenceRecords,
  courses,
}: PassportDisclosureSectionProps) {
  const [settings, setSettings] = useState(defaultSettings)
  const evidenceById = useMemo(() => new Map(evidenceRecords.map((e) => [e.id, e])), [evidenceRecords])
  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])

  const view = useMemo(
    () => buildExternalPassportView({ version, settings, institution, programme, studentName, evidenceById, courseById }),
    [version, settings, institution, programme, studentName, evidenceById, courseById]
  )

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <DisclosureControls settings={settings} onChange={setSettings} />
      <ExternalPassportPreview view={view} />
    </div>
  )
}
