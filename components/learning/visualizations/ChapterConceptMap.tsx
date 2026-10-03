import type { ConceptReadiness } from '@/lib/utilities/learning-projection'

export interface ChapterConceptMapProps {
  concepts: ConceptReadiness[]
  /** [conceptId, requiresConceptId] pairs — real LearningPrerequisite records, never inferred adjacency. */
  prerequisites: [string, string][]
}

const NODE_TONE: Record<string, string> = {
  not_attempted: 'border-campus-border text-campus-muted',
  guided: 'border-campus-amber-600 text-campus-amber-600 dark:border-campus-amber-dark dark:text-campus-amber-dark',
  partially_independent: 'border-campus-amber-600 text-campus-amber-600 dark:border-campus-amber-dark dark:text-campus-amber-dark',
  independently_demonstrated: 'border-campus-blue-600 text-campus-blue-600 dark:border-campus-blue-dark dark:text-campus-blue-dark',
  transfer_demonstrated: 'border-campus-blue-600 text-campus-blue-600 dark:border-campus-blue-dark dark:text-campus-blue-dark',
  evidence_candidate: 'border-campus-purple-600 text-campus-purple-600 dark:border-campus-purple-dark dark:text-campus-purple-dark',
  reviewed_evidence: 'border-campus-green-600 text-campus-green-600 dark:border-campus-green-dark dark:text-campus-green-dark',
}

/**
 * A concept-and-evidence workspace map, deliberately distinct from the
 * Odyssey roadmap's visual language (this is prerequisite structure
 * within one lesson, not a destination path) — a restrained layered SVG,
 * prerequisite below, dependent concept above, connected by one real
 * LearningPrerequisite edge.
 */
export function ChapterConceptMap({ concepts, prerequisites }: ChapterConceptMapProps) {
  const byId = new Map(concepts.map((c) => [c.conceptId, c]))
  const width = 420
  const nodeWidth = 168
  const nodeHeight = 44

  // Layer 0: concepts with no prerequisite among this set. Layer 1: everything else.
  const requiredIds = new Set(prerequisites.map(([, req]) => req))
  const dependentIds = new Set(prerequisites.map(([id]) => id))
  const baseLayer = concepts.filter((c) => requiredIds.has(c.conceptId) || !dependentIds.has(c.conceptId));
  const upperLayer = concepts.filter((c) => !baseLayer.includes(c))

  const positions = new Map<string, { x: number; y: number }>()
  baseLayer.forEach((c, i) => positions.set(c.conceptId, { x: 20 + i * (nodeWidth + 24), y: 90 }))
  upperLayer.forEach((c, i) => positions.set(c.conceptId, { x: 20 + i * (nodeWidth + 24), y: 10 }))

  const height = upperLayer.length > 0 ? 90 + nodeHeight + 20 : 90 + nodeHeight + 20

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="concept-map-title" className="w-full max-w-[420px]">
        <title id="concept-map-title">Chapter concept map showing prerequisite relationships between concepts in this lesson</title>
        {prerequisites.map(([conceptId, requiresId]) => {
          const from = positions.get(requiresId)
          const to = positions.get(conceptId)
          if (!from || !to) return null
          const x1 = from.x + nodeWidth / 2
          const y1 = from.y
          const x2 = to.x + nodeWidth / 2
          const y2 = to.y + nodeHeight
          return <line key={`${conceptId}-${requiresId}`} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-campus-muted" strokeWidth={1.5} markerEnd="url(#concept-arrow)" />
        })}
        <defs>
          <marker id="concept-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className="fill-campus-muted" />
          </marker>
        </defs>
        {concepts.map((concept) => {
          const pos = positions.get(concept.conceptId)
          if (!pos) return null
          return (
            <g key={concept.conceptId}>
              <rect x={pos.x} y={pos.y} width={nodeWidth} height={nodeHeight} rx={8} className={`fill-campus-surface stroke-2 ${NODE_TONE[concept.state]}`} />
              <text x={pos.x + nodeWidth / 2} y={pos.y + nodeHeight / 2 + 4} textAnchor="middle" className="fill-campus-text font-campus-sans text-[11px] font-medium">
                {concept.title.length > 24 ? `${concept.title.slice(0, 22)}…` : concept.title}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="sr-only">
        Concept prerequisites:{' '}
        {prerequisites.map(([id, req]) => `${byId.get(req)?.title ?? req} is required before ${byId.get(id)?.title ?? id}.`).join(' ')}
      </p>
    </div>
  )
}
