import type { EvidenceRecord, EvidenceReview } from '@/lib/campus-types'
import { evidenceRecords, evidenceReviews } from '@/lib/mock-data/seed'

export interface EvidenceWithReview {
  record: EvidenceRecord
  review: EvidenceReview
}

export interface EvidenceRepository {
  listForStudent(studentId: string): Promise<EvidenceWithReview[]>
  get(id: string): Promise<EvidenceWithReview | undefined>
  listPendingReview(): Promise<EvidenceWithReview[]>
  listForCapability(capabilityId: string): Promise<EvidenceWithReview[]>
  /** The evidence record that supersedes the given one, if any. */
  getSupersedingRecord(evidenceId: string): Promise<EvidenceWithReview | undefined>
}

function withReview(record: EvidenceRecord): EvidenceWithReview | undefined {
  const review = evidenceReviews.find((r) => r.evidenceId === record.id)
  return review ? { record, review } : undefined
}

export const mockEvidenceRepository: EvidenceRepository = {
  async listForStudent(studentId) {
    return evidenceRecords.filter((e) => e.studentId === studentId).map(withReview).filter((e): e is EvidenceWithReview => Boolean(e))
  },
  async get(id) {
    const record = evidenceRecords.find((e) => e.id === id)
    return record ? withReview(record) : undefined
  },
  async listPendingReview() {
    return evidenceRecords
      .map(withReview)
      .filter((e): e is EvidenceWithReview => Boolean(e))
      .filter((e) => e.review.status === 'pending')
  },
  async listForCapability(capabilityId) {
    return evidenceRecords
      .filter((e) => e.capabilityIds.includes(capabilityId))
      .map(withReview)
      .filter((e): e is EvidenceWithReview => Boolean(e))
  },
  async getSupersedingRecord(evidenceId) {
    const record = evidenceRecords.find((e) => e.supersedesEvidenceId === evidenceId)
    return record ? withReview(record) : undefined
  },
}
