import type { CapabilityDefinition, CapabilityState } from '@/lib/campus-types'
import { capabilityDefinitions, capabilityStates } from '@/lib/mock-data/seed'

export interface CapabilityRepository {
  listDefinitions(): Promise<CapabilityDefinition[]>
  getDefinition(id: string): Promise<CapabilityDefinition | undefined>
  listStatesForSubject(subjectId: string): Promise<CapabilityState[]>
  getState(id: string): Promise<CapabilityState | undefined>
}

export const mockCapabilityRepository: CapabilityRepository = {
  async listDefinitions() {
    return capabilityDefinitions
  },
  async getDefinition(id) {
    return capabilityDefinitions.find((c) => c.id === id)
  },
  async listStatesForSubject(subjectId) {
    return capabilityStates.filter((s) => s.subjectId === subjectId)
  },
  async getState(id) {
    return capabilityStates.find((s) => s.id === id)
  },
}
