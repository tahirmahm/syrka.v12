import type { Node, Edge } from '@xyflow/react'
import type { CapabilityDefinition, CapabilityClaim, CapabilityRelationEdge } from '@/lib/campus-types'

export interface CapabilityNodeData extends Record<string, unknown> {
  kind: 'capability'
  definition: CapabilityDefinition
  claim?: CapabilityClaim
}

export interface DomainLabelNodeData extends Record<string, unknown> {
  kind: 'domainLabel'
  domain: string
}

const COLUMN_WIDTH = 260
const ROW_HEIGHT = 130
const DOMAIN_LABEL_Y = -70

/**
 * Deterministic domain-grouped layout — no force simulation. Capabilities
 * are columned by domain (DESIGN-001 §10 "grouped by ontology domain") and
 * stacked within each column, so the same data always renders identically.
 */
export function buildCapabilityGraph(
  definitions: CapabilityDefinition[],
  claims: CapabilityClaim[],
  relationEdges: CapabilityRelationEdge[]
): { nodes: Node<CapabilityNodeData | DomainLabelNodeData>[]; edges: Edge[] } {
  const claimByCapabilityId = new Map(claims.map((c) => [c.capabilityId, c]))
  const domains = Array.from(new Set(definitions.map((d) => d.domain)))

  const nodes: Node<CapabilityNodeData | DomainLabelNodeData>[] = []

  domains.forEach((domain, columnIndex) => {
    const x = columnIndex * COLUMN_WIDTH
    nodes.push({
      id: `domain-${domain}`,
      type: 'domainLabel',
      position: { x, y: DOMAIN_LABEL_Y },
      data: { kind: 'domainLabel', domain },
      selectable: false,
      draggable: false,
      focusable: false,
    })

    definitions
      .filter((d) => d.domain === domain)
      .forEach((definition, rowIndex) => {
        nodes.push({
          id: definition.id,
          type: 'capability',
          position: { x, y: rowIndex * ROW_HEIGHT },
          data: { kind: 'capability', definition, claim: claimByCapabilityId.get(definition.id) },
          draggable: false,
        })
      })
  })

  const edges: Edge[] = relationEdges.map((edge) => ({
    id: edge.id,
    source: edge.fromCapabilityId,
    target: edge.toCapabilityId,
    label: edge.type === 'REQUIRES' ? 'requires' : 'related',
    style: {
      strokeWidth: Math.max(1, edge.confidence.score * 3),
      strokeDasharray: edge.type === 'DEPENDS_ON' ? '4 3' : undefined,
    },
    animated: false,
  }))

  return { nodes, edges }
}
