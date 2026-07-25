import type { EvidenceItem } from '@/lib/campus-types'
import { evidenceItems } from '@/lib/mock-data/seed'

export interface EvidenceRepository {
  listForStudent(studentId: string): Promise<EvidenceItem[]>
  get(id: string): Promise<EvidenceItem | undefined>
  listPendingReview(): Promise<EvidenceItem[]>
}

export const mockEvidenceRepository: EvidenceRepository = {
  async listForStudent(studentId) {
    return evidenceItems.filter((e) => e.studentId === studentId)
  },
  async get(id) {
    return evidenceItems.find((e) => e.id === id)
  },
  async listPendingReview() {
    return evidenceItems.filter((e) => e.status === 'pending')
  },
}
