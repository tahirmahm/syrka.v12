import type { OdysseyPlan } from '@/lib/campus-types'
import { odysseyPlan } from '@/lib/mock-data/seed'

export interface OdysseyRepository {
  getPlanForStudent(studentId: string): Promise<OdysseyPlan | undefined>
}

export const mockOdysseyRepository: OdysseyRepository = {
  async getPlanForStudent(studentId) {
    return odysseyPlan.studentId === studentId ? odysseyPlan : undefined
  },
}
