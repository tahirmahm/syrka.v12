import type { Learning3DVisualSpec } from '@/lib/campus-types/learning-3d-visual-spec'
import { LEARNING_3D_VISUAL_SPEC_SCHEMA_VERSION } from '@/lib/campus-types/learning-3d-visual-spec'

/**
 * True-3D learning addendum — the one bounded 3D scene this pass ships:
 * a terrain of named land parcels for NCERT Geography "Resources and
 * Development" §"Sustainable development" (land/soil degradation and
 * conservation), gated to ncert-concept-geo-1-2. Every soilQuality value
 * and stage target below is hand-authored curriculum content, never
 * DeepSeek-generated — provenance is honestly 'faculty_authored_deterministic'.
 */
export function getGeographyTerrainResourceSpec(): Learning3DVisualSpec {
  return {
    id: 'learning-3d-geo-1-2-terrain',
    schemaVersion: LEARNING_3D_VISUAL_SPEC_SCHEMA_VERSION,
    sceneIntent: 'terrain_resource_system',
    spaceId: 'ncert-space-geography',
    chapterId: 'ncert-chapter-geo-1',
    conceptId: 'ncert-concept-geo-1-2',
    title: 'Land degradation and conservation across four parcels',
    learningObjective: 'Predict and explain how extraction intensity and conservation choices change long-term soil productivity, region by region.',
    camera: {
      initialPosition: [5, 4.5, 6],
      target: [1.5, 0, 1],
      minDistance: 4,
      maxDistance: 11,
      minPolarAngle: 0.35,
      maxPolarAngle: 1.3,
    },
    objects: [
      { id: 'region-forest', kind: 'terrain_region', label: 'Forest reserve', gridPosition: { col: 0, row: 0 }, soilQuality: 0.95, resourceType: 'forest' },
      { id: 'region-farmland', kind: 'terrain_region', label: 'Agricultural land', gridPosition: { col: 1, row: 0 }, soilQuality: 0.8, resourceType: 'agricultural_land' },
      { id: 'region-mining', kind: 'terrain_region', label: 'Mining zone', gridPosition: { col: 2, row: 0 }, soilQuality: 0.55, resourceType: 'mining_zone' },
      { id: 'region-catchment', kind: 'terrain_region', label: 'Water catchment', gridPosition: { col: 1, row: 1 }, soilQuality: 0.9, resourceType: 'water_catchment' },
    ],
    objectRelationships: [
      { fromObjectId: 'region-mining', toObjectId: 'region-farmland', kind: 'extraction_pressure', description: 'Unregulated extraction upslope increases erosion on the adjacent farmland.' },
      { fromObjectId: 'region-mining', toObjectId: 'region-catchment', kind: 'runoff_effect', description: 'Bare mined soil raises sediment runoff into the shared catchment.' },
      { fromObjectId: 'region-forest', toObjectId: 'region-catchment', kind: 'conservation_support', description: 'Forest cover upslope reduces runoff and supports catchment water quality.' },
    ],
    lighting: 'daylight_neutral',
    animationStages: [
      {
        id: 'stage-baseline',
        order: 0,
        label: 'Year 0 — baseline',
        narration: 'Four parcels in current condition: forest, farmland, an active mining zone, and the catchment they all drain into.',
        objectSoilQualityTargets: { 'region-forest': 0.95, 'region-farmland': 0.8, 'region-mining': 0.55, 'region-catchment': 0.9 },
      },
      {
        id: 'stage-extraction',
        order: 1,
        label: 'Year 5 — extraction continues unchecked',
        narration: 'Without conservation measures, the mining zone\'s bare soil erodes further, and sediment runoff begins degrading the farmland and catchment.',
        objectSoilQualityTargets: { 'region-forest': 0.9, 'region-farmland': 0.55, 'region-mining': 0.25, 'region-catchment': 0.65 },
      },
      {
        id: 'stage-degraded',
        order: 2,
        label: 'Year 10 — severe degradation (no intervention)',
        narration: 'A decade of unmanaged extraction has visibly degraded three of the four parcels — this is what "resources are not fixed by nature" looks like when human use ignores capacity.',
        objectSoilQualityTargets: { 'region-forest': 0.82, 'region-farmland': 0.35, 'region-mining': 0.1, 'region-catchment': 0.45 },
      },
      {
        id: 'stage-conservation',
        order: 3,
        label: 'Year 10 — with conservation intervention applied at Year 5',
        narration: 'The same starting point, but contour bunding and afforestation were applied at Year 5: the mining zone stabilises, and the farmland and catchment partially recover rather than continuing to decline.',
        objectSoilQualityTargets: { 'region-forest': 0.95, 'region-farmland': 0.68, 'region-mining': 0.4, 'region-catchment': 0.78 },
      },
    ],
    interactionControls: ['orbit', 'select_region', 'change_variable', 'play_pause_step', 'compare_before_after'],
    assessmentHooks: [
      {
        id: 'hook-predict',
        purpose: 'predict',
        prompt: 'Before playing the sequence: if the mining zone continues without conservation measures, will the farmland\'s soil quality most likely increase, stay the same, or decrease? Why?',
        requiresRemovalForIndependence: false,
      },
      {
        id: 'hook-transfer',
        purpose: 'transfer',
        prompt: 'A different region has a quarry uphill of a village\'s only farmland, with no conservation measures planned. Using what you predicted here, explain what is likely to happen to that farmland over ten years, and name one conservation measure that could change the outcome.',
        requiresRemovalForIndependence: true,
      },
    ],
    altText: 'A 4-parcel 3D terrain — forest, agricultural land, a mining zone, and a water catchment — where parcel height and colour represent soil quality, animating from a healthy baseline through unchecked extraction to either severe degradation or partial recovery under conservation.',
    structuredFallback:
      'Four land parcels drain into a shared catchment: a forest reserve (soil quality 0.95), agricultural land (0.8), a mining zone (0.55), and the water catchment itself (0.9). Left unmanaged for ten years, the mining zone\'s soil quality falls to about 0.1, dragging farmland down to about 0.35 and the catchment to about 0.45 through erosion and runoff. If contour bunding and afforestation are applied at Year 5 instead, the mining zone stabilises around 0.4 and the farmland and catchment partially recover to about 0.68 and 0.78. The forest reserve stays relatively stable throughout because it is not being extracted from.',
    provenance: 'faculty_authored_deterministic',
    performanceTier: 'standard',
  }
}
