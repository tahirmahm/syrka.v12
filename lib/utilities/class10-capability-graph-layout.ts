import type { Node, Edge } from '@xyflow/react'
import type { ClassXCapabilitySummary } from './class10-capability-projection'

/**
 * CLASSX-001 §9 — the Class X Capability formation graph, rebuilt around
 * the actual ontology (Subject → chapter → concept → Evidence →
 * Capability) rather than a flat row of disconnected boxes. Deterministic
 * column layout, same discipline as capability-graph-layout.ts — no force
 * simulation, so the same data always renders identically. Odyssey/
 * Passport implications are shown in the node inspector rather than as
 * extra graph nodes, to keep the default view legible.
 */
export type ClassXGraphNodeKind = 'subject' | 'chapter' | 'concept' | 'evidence' | 'capability'

export interface ClassXGraphNodeData extends Record<string, unknown> {
  kind: ClassXGraphNodeKind
  label: string
  sublabel?: string
  capability?: ClassXCapabilitySummary
  href?: string
}

const COLUMN_WIDTH = 220
const ROW_HEIGHT = 90

export function buildClassXCapabilityGraph(capabilities: ClassXCapabilitySummary[]): { nodes: Node<ClassXGraphNodeData>[]; edges: Edge[] } {
  const nodes: Node<ClassXGraphNodeData>[] = []
  const edges: Edge[] = []
  let row = 0

  for (const capability of capabilities) {
    const capabilityNodeId = `capability-${capability.id}`
    const capabilityRow = row + Math.max(0, capability.supportingConcepts.length - 1) / 2

    nodes.push({
      id: capabilityNodeId,
      type: 'classXGraph',
      position: { x: 4 * COLUMN_WIDTH, y: capabilityRow * ROW_HEIGHT },
      data: { kind: 'capability', label: capability.name, sublabel: capability.stateLabel, capability, href: `/student/capabilities/${capability.id}` },
      draggable: false,
    })

    if (capability.supportingConcepts.length === 0) {
      row += 1
      continue
    }

    const seenSubjects = new Set<string>()
    const seenChapters = new Set<string>()

    capability.supportingConcepts.forEach((concept, i) => {
      const subjectNodeId = `subject-${concept.subject}`
      const chapterNodeId = `chapter-${concept.chapterId}`
      const conceptNodeId = `concept-${concept.chapterId}-${i}`
      const evidenceNodeId = `evidence-${concept.chapterId}-${i}`
      const y = (row + i) * ROW_HEIGHT

      if (!seenSubjects.has(subjectNodeId)) {
        seenSubjects.add(subjectNodeId)
        nodes.push({ id: subjectNodeId, type: 'classXGraph', position: { x: 0, y }, data: { kind: 'subject', label: concept.subject }, draggable: false })
      }
      if (!seenChapters.has(chapterNodeId)) {
        seenChapters.add(chapterNodeId)
        nodes.push({
          id: chapterNodeId,
          type: 'classXGraph',
          position: { x: COLUMN_WIDTH, y },
          data: { kind: 'chapter', label: concept.chapterTitle, href: `/student/learning/${concept.spaceId}/${concept.chapterId}` },
          draggable: false,
        })
        edges.push({ id: `${subjectNodeId}-${chapterNodeId}`, source: subjectNodeId, target: chapterNodeId })
      }

      nodes.push({
        id: conceptNodeId,
        type: 'classXGraph',
        position: { x: 2 * COLUMN_WIDTH, y },
        data: { kind: 'concept', label: concept.conceptTitle, href: `/student/learning/${concept.spaceId}/${concept.chapterId}` },
        draggable: false,
      })
      edges.push({ id: `${chapterNodeId}-${conceptNodeId}`, source: chapterNodeId, target: conceptNodeId })

      nodes.push({
        id: evidenceNodeId,
        type: 'classXGraph',
        position: { x: 3 * COLUMN_WIDTH, y },
        data: { kind: 'evidence', label: concept.facultyReviewed ? 'Reviewed Evidence' : 'Evidence candidate', sublabel: concept.transferDemonstrated ? 'Independent transfer' : undefined },
        draggable: false,
      })
      edges.push({ id: `${conceptNodeId}-${evidenceNodeId}`, source: conceptNodeId, target: evidenceNodeId })
      edges.push({ id: `${evidenceNodeId}-${capabilityNodeId}`, source: evidenceNodeId, target: capabilityNodeId, animated: concept.facultyReviewed })
    })

    row += capability.supportingConcepts.length
  }

  return { nodes, edges }
}
