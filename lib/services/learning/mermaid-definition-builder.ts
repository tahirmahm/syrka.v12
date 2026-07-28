import type { LearningVisualSpec } from '@/lib/campus-types/learning-visual-spec'

/**
 * LEARN-002 §10 — builds a plain Mermaid flowchart definition from a
 * validated LearningVisualSpec's own node/edge data. Never emits `click`
 * directives, links, or any Mermaid syntax beyond node/edge declarations
 * with escaped text labels — there is no code path here that could turn
 * an untrusted label into an executable directive, independent of
 * Mermaid's own `securityLevel: "strict"` setting applied at render time.
 */
function escapeMermaidLabel(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .replace(/"/g, "'")
    .replace(/[[\]{}|]/g, '')
    .replace(/\n/g, ' ')
    .slice(0, 120)
}

export function buildMermaidFlowchartDefinition(spec: LearningVisualSpec): string {
  const direction = spec.orientation === 'vertical' ? 'TD' : spec.orientation === 'radial' ? 'TD' : 'LR'
  const lines = [`flowchart ${direction}`]

  for (const node of spec.nodes) {
    lines.push(`  ${node.id}["${escapeMermaidLabel(node.label)}"]`)
  }
  for (const edge of spec.edges) {
    const label = edge.label ? `|"${escapeMermaidLabel(edge.label)}"|` : ''
    lines.push(`  ${edge.fromNodeId} -->${label} ${edge.toNodeId}`)
  }

  return lines.join('\n')
}
