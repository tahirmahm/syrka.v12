import type { CapabilityDefinition, CapabilityClaim, CapabilityRelationEdge } from '@/lib/campus-types'
import { capabilityDefinitions, capabilityClaims, capabilityRelationEdges } from '@/lib/mock-data/seed'

export interface CapabilityRepository {
  listDefinitions(): Promise<CapabilityDefinition[]>
  getDefinition(id: string): Promise<CapabilityDefinition | undefined>
  listClaimsForSubject(subjectId: string): Promise<CapabilityClaim[]>
  getClaim(id: string): Promise<CapabilityClaim | undefined>
  getClaimForCapability(subjectId: string, capabilityId: string): Promise<CapabilityClaim | undefined>
  listRelationEdges(): Promise<CapabilityRelationEdge[]>
}

export const mockCapabilityRepository: CapabilityRepository = {
  async listDefinitions() {
    return capabilityDefinitions
  },
  async getDefinition(id) {
    return capabilityDefinitions.find((c) => c.id === id)
  },
  async listClaimsForSubject(subjectId) {
    return capabilityClaims.filter((c) => c.subjectId === subjectId)
  },
  async getClaim(id) {
    return capabilityClaims.find((c) => c.id === id)
  },
  async getClaimForCapability(subjectId, capabilityId) {
    return capabilityClaims.find((c) => c.subjectId === subjectId && c.capabilityId === capabilityId)
  },
  async listRelationEdges() {
    return capabilityRelationEdges
  },
}
