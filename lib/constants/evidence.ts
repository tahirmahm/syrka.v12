import type { EvidenceSourceType } from '@/lib/campus-types'

export const SOURCE_TYPE_LABELS: Record<EvidenceSourceType, string> = {
  assignment: 'Assignment',
  assessment: 'Assessment',
  project: 'Project',
  research: 'Research',
  presentation: 'Presentation',
  internship: 'Internship',
  extracurricular: 'Extracurricular',
  faculty_review: 'Faculty review',
  external_credential: 'External credential',
}
