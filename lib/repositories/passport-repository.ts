import type { Passport } from '@/lib/campus-types'
import { passport } from '@/lib/mock-data/seed'

export interface PassportRepository {
  getForStudent(studentId: string): Promise<Passport | undefined>
}

export const mockPassportRepository: PassportRepository = {
  async getForStudent(studentId) {
    return passport.studentId === studentId ? passport : undefined
  },
}
