/**
 * The exhaustive set of Student-facing renderer categories for a Learning
 * visual. Mermaid and any other generic node-edge graph engine are not
 * part of this set — Syrka was found (Preview review, LEARN-002 Mermaid
 * removal directive) to render isolated-keyword hub-and-spoke charts
 * ("distinction" -> "primitive"/"subsistence"/"intensive"/"commercial",
 * all connected by a generic "relates to" edge) when a generic graph
 * renderer was available as a choice, live model or deterministic. A
 * renderer that cannot express a real relationship narrative must not be
 * offered at all, to DeepSeek or to the deterministic router. Any value
 * outside this set (or absent) must fall back to `syrka_visual`, never
 * to a graph.
 */
export type LearningRenderer = 'syrka_visual' | 'custom_interactive' | 'desmos' | 'three_scene' | 'excalidraw' | 'structured_text'

export const VALID_LEARNING_RENDERERS: readonly LearningRenderer[] = ['syrka_visual', 'custom_interactive', 'desmos', 'three_scene', 'excalidraw', 'structured_text']

export function isLearningRenderer(value: unknown): value is LearningRenderer {
  return typeof value === 'string' && (VALID_LEARNING_RENDERERS as readonly string[]).includes(value)
}
