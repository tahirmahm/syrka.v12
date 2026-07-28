import { LEARNING_VISUAL_SPEC_LIMITS, LEARNING_VISUAL_SPEC_SCHEMA_VERSION, type LearningVisualSpec } from '@/lib/campus-types/learning-visual-spec'

export interface VisualSpecValidationResult {
  valid: boolean
  issues: string[]
}

const VALID_INTENTS = new Set([
  'concept_map', 'causal_flow', 'process', 'timeline', 'cycle', 'hierarchy', 'comparison',
  'classification', 'argument_map', 'decision_tree', 'system_model', 'mathematical_graph',
  'simulation', 'animated_transformation',
])

const VALID_RENDERERS = new Set(['mermaid', 'desmos', 'custom_react', 'custom_canvas', 'excalidraw', 'structured_text', 'static_accessible_fallback'])

/**
 * The single authority on whether a LearningVisualSpec — DeepSeek-proposed
 * or deterministically built — is ever shown to a student. Rejects
 * anything exceeding the schema's hard limits or missing a required
 * accessibility field; never attempts to "fix up" an invalid spec. See
 * docs/adr/LEARN-002-adaptive-visual-learning-system.md §5.
 */
export function validateVisualSpec(spec: unknown): VisualSpecValidationResult {
  const issues: string[] = []

  if (!spec || typeof spec !== 'object') {
    return { valid: false, issues: ['Spec is not an object.'] }
  }
  const s = spec as Partial<LearningVisualSpec>

  if (s.schemaVersion !== LEARNING_VISUAL_SPEC_SCHEMA_VERSION) issues.push(`Unsupported schemaVersion: ${String(s.schemaVersion)}`)
  if (!s.id || typeof s.id !== 'string') issues.push('Missing id.')
  if (!s.tenantId || typeof s.tenantId !== 'string') issues.push('Missing tenantId.')
  if (!s.spaceId || !s.chapterId || !s.conceptId) issues.push('Missing spaceId/chapterId/conceptId.')
  if (!s.title || typeof s.title !== 'string') issues.push('Missing title.')
  if (!s.learningObjective) issues.push('Missing learningObjective.')
  if (!s.visualIntent || !VALID_INTENTS.has(s.visualIntent)) issues.push(`Invalid visualIntent: ${String(s.visualIntent)}`)
  if (!s.renderer || !VALID_RENDERERS.has(s.renderer)) issues.push(`Invalid renderer: ${String(s.renderer)}`)

  const nodes = Array.isArray(s.nodes) ? s.nodes : []
  const edges = Array.isArray(s.edges) ? s.edges : []
  const groups = Array.isArray(s.groups) ? s.groups : []
  const stages = Array.isArray(s.stages) ? s.stages : []
  const annotations = Array.isArray(s.annotations) ? s.annotations : []
  const sourceReferences = Array.isArray(s.sourceReferences) ? s.sourceReferences : []

  if (nodes.length > LEARNING_VISUAL_SPEC_LIMITS.maxNodes) issues.push(`Too many nodes (${nodes.length} > ${LEARNING_VISUAL_SPEC_LIMITS.maxNodes}).`)
  if (edges.length > LEARNING_VISUAL_SPEC_LIMITS.maxEdges) issues.push(`Too many edges (${edges.length} > ${LEARNING_VISUAL_SPEC_LIMITS.maxEdges}).`)
  if (groups.length > LEARNING_VISUAL_SPEC_LIMITS.maxGroups) issues.push(`Too many groups (${groups.length} > ${LEARNING_VISUAL_SPEC_LIMITS.maxGroups}).`)
  if (stages.length > LEARNING_VISUAL_SPEC_LIMITS.maxStages) issues.push(`Too many stages (${stages.length} > ${LEARNING_VISUAL_SPEC_LIMITS.maxStages}).`)
  if (annotations.length > LEARNING_VISUAL_SPEC_LIMITS.maxAnnotations) issues.push(`Too many annotations (${annotations.length} > ${LEARNING_VISUAL_SPEC_LIMITS.maxAnnotations}).`)
  if (sourceReferences.length > LEARNING_VISUAL_SPEC_LIMITS.maxSourceReferences) issues.push(`Too many source references.`)

  const nodeIds = new Set(nodes.map((n) => n.id))
  for (const node of nodes) {
    if (!node.label || node.label.length > LEARNING_VISUAL_SPEC_LIMITS.maxLabelLength) issues.push(`Node "${node.id}" label missing or too long.`)
  }
  for (const edge of edges) {
    if (!nodeIds.has(edge.fromNodeId) || !nodeIds.has(edge.toNodeId)) issues.push(`Edge "${edge.id}" references a node id that does not exist.`)
  }
  for (const group of groups) {
    for (const nid of group.nodeIds) {
      if (!nodeIds.has(nid)) issues.push(`Group "${group.id}" references a node id that does not exist.`)
    }
  }
  for (const stage of stages) {
    if (stage.narration && stage.narration.length > LEARNING_VISUAL_SPEC_LIMITS.maxNarrationLength) issues.push(`Stage "${stage.id}" narration too long.`)
  }

  if (!s.explanation || s.explanation.length > LEARNING_VISUAL_SPEC_LIMITS.maxExplanationLength) issues.push('Missing or too-long explanation.')
  if (!s.altText || s.altText.length > LEARNING_VISUAL_SPEC_LIMITS.maxAltTextLength) issues.push('Missing or too-long altText — required for accessibility.')
  if (!s.structuredTextEquivalent) issues.push('Missing structuredTextEquivalent — required as the non-visual fallback.')
  if (!s.controls) issues.push('Missing controls.')
  if (!s.generatedBy) issues.push('Missing generatedBy provenance.')

  // Reject any attempt to smuggle executable content through a string field.
  const suspiciousPattern = /<script|<\/script|javascript:|on\w+\s*=|<iframe/i
  const allText = [s.title, s.explanation, s.altText, s.structuredTextEquivalent, ...nodes.map((n) => n.label), ...annotations.map((a) => a.text)]
    .filter((t): t is string => typeof t === 'string')
    .join(' ')
  if (suspiciousPattern.test(allText)) issues.push('Spec text contains disallowed script-like content.')

  return { valid: issues.length === 0, issues }
}
