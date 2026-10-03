/**
 * Roles — verbatim from UX-001's persona table, restricted to this
 * frontend phase's scope (Student, Faculty, University Administrator).
 * There is no separate "Department Administrator" persona: the Department
 * experience is University Administration scoped to one department, via
 * AdministratorScope below, not a distinct role or ontology concept.
 */
export type UserRole = 'student' | 'faculty' | 'university_administrator'

export interface AdministratorScope {
  level: 'institution' | 'department'
  institutionId: string
  departmentId?: string
}

export interface CampusUser {
  id: string
  name: string
  role: UserRole
  institutionId: string
  /** Only present for university_administrator; undefined implies institution-wide scope. */
  administratorScope?: AdministratorScope
  /** Only present for student. */
  programmeId?: string
  /** Only present for faculty. */
  departmentId?: string
}
