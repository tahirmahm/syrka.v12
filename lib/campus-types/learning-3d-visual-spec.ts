/**
 * True-3D learning addendum (LEARN-002) — a bounded 3D counterpart to
 * LearningVisualSpec (learning-visual-spec.ts). Never stores shaders,
 * arbitrary Three.js source, JavaScript, or remote model URLs — only a
 * structured description of an allowlisted scene that
 * Terrain3DVisual/TerrainResourceScene interpret. Object "kind" is
 * restricted to a small allowlist rendered by fixed, Syrka-owned
 * geometry — a spec can never introduce a new visual primitive, only
 * arrange and animate the ones the renderer already knows how to draw.
 */

export const LEARNING_3D_VISUAL_SPEC_SCHEMA_VERSION = '1.0.0'

export type Learning3DSceneIntent = 'terrain_resource_system'

export type Learning3DObjectKind = 'terrain_region' | 'label_marker'

export interface Learning3DObject {
  id: string
  kind: Learning3DObjectKind
  label: string
  /** Grid position, not free 3D placement — keeps layout legible and collision-free. */
  gridPosition: { col: number; row: number }
  /** 0 (bare/degraded) to 1 (healthy) — drives both height and colour deterministically. */
  soilQuality: number
  resourceType: 'forest' | 'agricultural_land' | 'mining_zone' | 'water_catchment'
}

export interface Learning3DObjectRelationship {
  fromObjectId: string
  toObjectId: string
  kind: 'extraction_pressure' | 'runoff_effect' | 'conservation_support'
  description: string
}

export interface Learning3DAnimationStage {
  id: string
  order: number
  label: string
  narration: string
  /** Target soilQuality per object at this stage — the renderer tweens toward these values. */
  objectSoilQualityTargets: Record<string, number>
}

export interface Learning3DAssessmentHook {
  id: string
  purpose: 'predict' | 'transfer'
  prompt: string
  requiresRemovalForIndependence: boolean
}

export interface Learning3DVisualSpec {
  id: string
  schemaVersion: typeof LEARNING_3D_VISUAL_SPEC_SCHEMA_VERSION
  sceneIntent: Learning3DSceneIntent
  spaceId: string
  chapterId: string
  conceptId: string
  title: string
  learningObjective: string
  camera: {
    initialPosition: [number, number, number]
    target: [number, number, number]
    minDistance: number
    maxDistance: number
    minPolarAngle: number
    maxPolarAngle: number
  }
  objects: Learning3DObject[]
  objectRelationships: Learning3DObjectRelationship[]
  lighting: 'daylight_neutral'
  animationStages: Learning3DAnimationStage[]
  interactionControls: ('orbit' | 'select_region' | 'change_variable' | 'play_pause_step' | 'compare_before_after')[]
  assessmentHooks: Learning3DAssessmentHook[]
  altText: string
  structuredFallback: string
  provenance: 'faculty_authored_deterministic'
  performanceTier: 'standard' | 'reduced'
}
