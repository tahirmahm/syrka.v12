import type { Passport, DisclosureSettings } from '@/lib/campus-types'
import { passport, disclosureSettings } from '@/lib/mock-data/seed'

export interface PassportRepository {
  getForStudent(studentId: string): Promise<Passport | undefined>
  /** Looked up by the Passport's own id — the public verification route never has a studentId to key on. */
  getById(passportId: string): Promise<Passport | undefined>
  getDisclosureSettings(studentId: string): Promise<DisclosureSettings>
}

export const mockPassportRepository: PassportRepository = {
  async getForStudent(studentId) {
    return passport.studentId === studentId ? passport : undefined
  },
  async getById(passportId) {
    return passport.id === passportId ? passport : undefined
  },
  async getDisclosureSettings() {
    // Frontend-only mock preference — same defaults regardless of student in this phase.
    return disclosureSettings
  },
}
