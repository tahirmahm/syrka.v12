/**
 * Institution hierarchy — DB-001 institutions.{institutions,departments,programmes,cohorts}.
 * Department is an org-scope, not a distinct persona/ontology concept (UX-001
 * defines only a University Administrator persona) — see lib/types/user.ts.
 */
export interface Institution {
  id: string
  name: string
  country: string
  departments: string[]
}

export interface Department {
  id: string
  institutionId: string
  name: string
  programmeIds: string[]
}

export interface Programme {
  id: string
  departmentId: string
  name: string
  degreeLevel: 'undergraduate' | 'graduate' | 'doctoral'
  courseIds: string[]
}

export interface Course {
  id: string
  programmeId: string
  code: string
  title: string
  facultyIds: string[]
  capabilityIds: string[]
}
