import type { Institution, Department, Programme, Course } from '@/lib/campus-types'
import { institution, department, programme, courses } from '@/lib/mock-data/seed'

export interface InstitutionRepository {
  getInstitution(id: string): Promise<Institution | undefined>
  getDepartment(id: string): Promise<Department | undefined>
  listDepartments(institutionId: string): Promise<Department[]>
  getProgramme(id: string): Promise<Programme | undefined>
  listCourses(programmeId: string): Promise<Course[]>
}

export const mockInstitutionRepository: InstitutionRepository = {
  async getInstitution(id) {
    return institution.id === id ? institution : undefined
  },
  async getDepartment(id) {
    return department.id === id ? department : undefined
  },
  async listDepartments(institutionId) {
    return institution.id === institutionId ? [department] : []
  },
  async getProgramme(id) {
    return programme.id === id ? programme : undefined
  },
  async listCourses(programmeId) {
    return courses.filter((c) => c.programmeId === programmeId)
  },
}
