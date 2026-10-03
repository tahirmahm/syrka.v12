import type { OdysseyEducationStage } from '@/lib/campus-types'
import { UNIVERSITY_STAGE_REGRESSION_STUDENT_ID } from '@/lib/repositories/odyssey-repository'

/**
 * CLASSX-001 §1 — a stage-aware Student identity, so the authenticated
 * shell never shows a university identity to the Class X demonstration
 * student. Deliberately not derived from lib/repositories/institution-
 * repository's Institution record — that record models the shared
 * university-stage institution used by Faculty/Department/University
 * views (out of scope for this correction) and would keep leaking
 * "Meridian University" into Student routes if reused here.
 */
export interface StudentIdentityProjection {
  stage: OdysseyEducationStage
  headerLabel: string
  classOrProgramme: string
  curriculum: string
  institutionType: string
  academicYear: string
  learnerProfileName: string
}

const CLASS_X_IDENTITY: StudentIdentityProjection = {
  stage: 'secondary_class_10',
  headerLabel: 'NCERT Class X · Syrka Demonstration School',
  classOrProgramme: 'Class X',
  curriculum: 'NCERT Class X demonstration curriculum (English, Geography, Economics, Political Science)',
  institutionType: 'Secondary school (demonstration)',
  academicYear: '2026–27',
  learnerProfileName: 'Alex Chen',
}

const UNIVERSITY_STAGE_IDENTITY: StudentIdentityProjection = {
  stage: 'university',
  headerLabel: 'Meridian University',
  classOrProgramme: 'BSc Computer Science',
  curriculum: 'University programme coursework',
  institutionType: 'University',
  academicYear: '2026–27',
  learnerProfileName: 'Alex Chen',
}

export function getStudentIdentity(studentId: string): StudentIdentityProjection {
  return studentId === UNIVERSITY_STAGE_REGRESSION_STUDENT_ID ? UNIVERSITY_STAGE_IDENTITY : CLASS_X_IDENTITY
}
