'use client'

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { animate } from 'animejs'
import 'animejs/adapters/three'
import type { Learning3DVisualSpec, Learning3DObject } from '@/lib/campus-types/learning-3d-visual-spec'

const REGION_SIZE = 1.6
const REGION_GAP = 0.3
const TERRAIN_SEGMENTS = 26
const IDW_POWER = 2.4
const IDW_EPSILON = 0.08

const HEALTHY_COLOR = new THREE.Color('#5a8f5a')
const DEGRADED_COLOR = new THREE.Color('#8a6a45')
const WATER_CLEAR = new THREE.Color('#3f83b0')
const WATER_TURBID = new THREE.Color('#8a7a52')
const ROCK_COLOR = new THREE.Color('#8f8579')
const CROP_ROW_COLOR = new THREE.Color('#8bab52')

/**
 * Fixed upland-to-valley elevation per resource type. This is terrain
 * *fact* — independent of the animating soilQuality variable — and is
 * what actually explains why runoff drains mining -> farmland -> catchment
 * on its own, rather than four unrelated coloured boxes whose height
 * happened to equal their soil quality (the founder's rejected "blocky
 * placeholder" version).
 */
const BASE_ELEVATION: Record<Learning3DObject['resourceType'], number> = {
  forest: 1.35,
  mining_zone: 1.05,
  agricultural_land: 0.55,
  water_catchment: 0.05,
}

const ARROW_TONE: Record<Learning3DVisualSpec['objectRelationships'][number]['kind'], string> = {
  extraction_pressure: '#c2703a',
  runoff_effect: '#8a5a2a',
  conservation_support: '#3f8f6a',
}

function qualityToColor(quality: number): THREE.Color {
  return DEGRADED_COLOR.clone().lerp(HEALTHY_COLOR, THREE.MathUtils.clamp(quality, 0, 1))
}

function regionCenterXZ(object: Learning3DObject): THREE.Vector2 {
  return new THREE.Vector2(object.gridPosition.col * (REGION_SIZE + REGION_GAP), object.gridPosition.row * (REGION_SIZE + REGION_GAP))
}

/** Inverse-distance weights of every region at an arbitrary (x, z) point — the same weighting drives both terrain height and vertex colour, so the two stay physically consistent. */
function idwWeights(objects: Learning3DObject[], x: number, z: number): number[] {
  const raw = objects.map((o) => {
    const c = regionCenterXZ(o)
    const d = Math.hypot(x - c.x, z - c.y) + IDW_EPSILON
    return 1 / d ** IDW_POWER
  })
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((w) => w / sum)
}

function terrainHeightAt(objects: Learning3DObject[], x: number, z: number): number {
  const weights = idwWeights(objects, x, z)
  return objects.reduce((h, o, i) => h + weights[i] * BASE_ELEVATION[o.resourceType], 0)
}

/** One continuous sloped surface (not four isolated boxes): a static heightfield from BASE_ELEVATION, vertex-coloured by a live blend of each region's current soil quality. */
function GroundMesh({
  spec,
  qualitiesRef,
  recomputeRef,
}: {
  spec: Learning3DVisualSpec
  qualitiesRef: MutableRefObject<Record<string, number>>
  recomputeRef: MutableRefObject<() => void>
}) {
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const minX = Math.min(...spec.objects.map((o) => regionCenterXZ(o).x)) - REGION_SIZE
  const maxX = Math.max(...spec.objects.map((o) => regionCenterXZ(o).x)) + REGION_SIZE
  const minZ = Math.min(...spec.objects.map((o) => regionCenterXZ(o).y)) - REGION_SIZE
  const maxZ = Math.max(...spec.objects.map((o) => regionCenterXZ(o).y)) + REGION_SIZE
  const width = maxX - minX
  const depth = maxZ - minZ
  const centerX = (minX + maxX) / 2
  const centerZ = (minZ + maxZ) / 2

  const { basePositions, weightsPerVertex, indices } = useMemo(() => {
    const segs = TERRAIN_SEGMENTS
    const basePositions: { x: number; z: number; height: number }[] = []
    const weightsPerVertex: number[][] = []
    for (let iz = 0; iz <= segs; iz++) {
      for (let ix = 0; ix <= segs; ix++) {
        const x = minX + (width * ix) / segs
        const z = minZ + (depth * iz) / segs
        basePositions.push({ x: x - centerX, z: z - centerZ, height: terrainHeightAt(spec.objects, x, z) })
        weightsPerVertex.push(idwWeights(spec.objects, x, z))
      }
    }
    const idx: number[] = []
    for (let iz = 0; iz < segs; iz++) {
      for (let ix = 0; ix < segs; ix++) {
        const a = iz * (segs + 1) + ix
        const b = a + 1
        const c = a + (segs + 1)
        const d = c + 1
        idx.push(a, c, b, b, c, d)
      }
    }
    return { basePositions, weightsPerVertex, indices: new Uint32Array(idx) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.id])

  const positionArray = useMemo(() => {
    const arr = new Float32Array(basePositions.length * 3)
    basePositions.forEach((p, i) => {
      arr[i * 3] = p.x
      arr[i * 3 + 1] = p.height
      arr[i * 3 + 2] = p.z
    })
    return arr
  }, [basePositions])

  // Must be memoized, not a literal `new Float32Array(...)` inline in JSX:
  // SceneContent re-renders on every animation tick, and a fresh literal
  // array there would re-attach a brand-new all-zero (black) colour
  // attribute on every one of those re-renders, wiping out whatever
  // recompute() had just written moments before the actual WebGL paint —
  // this was the exact cause of the terrain rendering solid black.
  const colorArray = useMemo(() => new Float32Array(basePositions.length * 3), [basePositions])

  const recompute = useMemo(
    () => () => {
      const geo = geometryRef.current
      if (!geo) return
      const colorAttr = geo.attributes.color as THREE.BufferAttribute
      const qualities = qualitiesRef.current
      const scratch = new THREE.Color()
      const contribution = new THREE.Color()
      for (let i = 0; i < basePositions.length; i++) {
        const weights = weightsPerVertex[i]
        scratch.setRGB(0, 0, 0)
        spec.objects.forEach((o, oi) => {
          const q = qualities[o.id] ?? o.soilQuality
          contribution.copy(qualityToColor(q)).multiplyScalar(weights[oi])
          scratch.add(contribution)
        })
        colorAttr.setXYZ(i, scratch.r, scratch.g, scratch.b)
      }
      colorAttr.needsUpdate = true
    },
    [basePositions, weightsPerVertex, qualitiesRef, spec.objects]
  )

  useEffect(() => {
    recomputeRef.current = recompute
    recompute()
    // The position attribute is static (elevation is fixed terrain fact, never
    // re-tweened), so normals only need computing once, right after the
    // buffer geometry mounts — without this, WebGL has no normals at all and
    // meshStandardMaterial lighting contributes nothing, rendering pure black
    // regardless of vertex colour.
    geometryRef.current?.computeVertexNormals()
  }, [recompute, recomputeRef])

  return (
    // No rotation: positionArray is already authored directly in final world
    // orientation (x, height, z) — this mesh is not the old flat XY plane
    // that relied on a -90° X rotation to lie down. Applying that rotation
    // here would remap height onto a horizontal axis, standing the terrain
    // up on its edge instead of laying it flat.
    <mesh position={[centerX, 0, centerZ]} receiveShadow name="terrain-ground">
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positionArray, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorArray, 3]} />
        <bufferAttribute attach="index" args={[indices, 1]} />
      </bufferGeometry>
      <meshStandardMaterial vertexColors roughness={0.92} side={THREE.DoubleSide} />
    </mesh>
  )
}

/** Small instanced decoration so each region reads as a distinct land cover, not a flat colour swatch: cone "trees" for forest, crop-row blocks for farmland, scattered rock debris for the mining zone, a pond for the catchment. Instance scale (not count) is driven by the live quality value, so density visibly grows/shrinks as the stage animates. */
function RegionCover({ object, quality }: { object: Learning3DObject; quality: number }) {
  const center = regionCenterXZ(object)
  const baseHeight = BASE_ELEVATION[object.resourceType]

  const instances = useMemo(() => {
    let seed = object.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    const count = object.resourceType === 'mining_zone' ? 10 : object.resourceType === 'water_catchment' ? 0 : 14
    return Array.from({ length: count }, () => ({
      dx: (rng() - 0.5) * REGION_SIZE * 1.3,
      dz: (rng() - 0.5) * REGION_SIZE * 1.3,
      threshold: rng(),
      scaleJitter: 0.6 + rng() * 0.5,
    }))
  }, [object.id, object.resourceType])

  if (object.resourceType === 'water_catchment') {
    const waterColor = WATER_TURBID.clone().lerp(WATER_CLEAR, quality)
    return (
      <mesh position={[center.x, baseHeight + 0.03, center.y]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[REGION_SIZE * 0.62, 24]} />
        <meshStandardMaterial color={waterColor} roughness={0.25} metalness={0.05} transparent opacity={0.88} />
      </mesh>
    )
  }

  return (
    <group>
      {instances.map((inst, i) => {
        // Instance i "activates" once quality clears its own random threshold — degradation thins cover gradually rather than as one visible snap.
        const active = quality >= inst.threshold * 0.85
        const scale = active ? inst.scaleJitter * (0.5 + quality * 0.5) : 0
        const x = center.x + inst.dx
        const z = center.y + inst.dz

        if (object.resourceType === 'mining_zone') {
          return (
            <mesh key={i} position={[x, baseHeight + 0.06 * scale, z]} scale={scale} castShadow>
              <dodecahedronGeometry args={[0.14, 0]} />
              <meshStandardMaterial color={ROCK_COLOR} roughness={1} />
            </mesh>
          )
        }
        if (object.resourceType === 'agricultural_land') {
          return (
            <mesh key={i} position={[x, baseHeight + 0.05 * scale, z]} scale={[scale, scale * 0.4, scale]} castShadow>
              <boxGeometry args={[0.22, 0.24, 0.09]} />
              <meshStandardMaterial color={CROP_ROW_COLOR} roughness={0.8} />
            </mesh>
          )
        }
        return (
          <mesh key={i} position={[x, baseHeight + 0.22 * scale, z]} scale={scale} castShadow>
            <coneGeometry args={[0.13, 0.42, 6]} />
            <meshStandardMaterial color="#3f6e3f" roughness={0.85} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Renders the concept's own authored objectRelationships (extraction_pressure / runoff_effect / conservation_support) as real directional flow arrows down the slope — data that existed in the spec but was never drawn at all in the previous version. */
function FlowArrow({
  spec,
  relationship,
  qualitiesRef,
}: {
  spec: Learning3DVisualSpec
  relationship: Learning3DVisualSpec['objectRelationships'][number]
  qualitiesRef: MutableRefObject<Record<string, number>>
}) {
  const from = spec.objects.find((o) => o.id === relationship.fromObjectId)!
  const to = spec.objects.find((o) => o.id === relationship.toObjectId)!
  const fromCenter = regionCenterXZ(from)
  const toCenter = regionCenterXZ(to)
  const fromY = BASE_ELEVATION[from.resourceType]
  const toY = BASE_ELEVATION[to.resourceType]

  const curve = useMemo(() => {
    const mid = new THREE.Vector3((fromCenter.x + toCenter.x) / 2, Math.max(fromY, toY) + 0.35, (fromCenter.y + toCenter.y) / 2)
    return new THREE.QuadraticBezierCurve3(new THREE.Vector3(fromCenter.x, fromY + 0.25, fromCenter.y), mid, new THREE.Vector3(toCenter.x, toY + 0.25, toCenter.y))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationship.fromObjectId, relationship.toObjectId])

  const tubeGeometry = useMemo(() => new THREE.TubeGeometry(curve, 24, 0.028, 8, false), [curve])
  const arrowTip = curve.getPoint(0.94)
  const arrowDir = curve.getTangent(0.96)
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), arrowDir.clone().normalize()), [arrowDir])

  const color = ARROW_TONE[relationship.kind]
  // Not memoized: read live every render so opacity tracks the mid-tween quality values, not just the value at the moment the stage changed.
  const qFrom = qualitiesRef.current[from.id] ?? from.soilQuality
  const qTo = qualitiesRef.current[to.id] ?? to.soilQuality
  const avg = (qFrom + qTo) / 2
  // Pressure/runoff read as more alarming the worse things get; conservation-support reads as stronger the healthier things get.
  const opacity = relationship.kind === 'conservation_support' ? 0.25 + avg * 0.65 : 0.25 + (1 - avg) * 0.65

  return (
    <group>
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.5} />
      </mesh>
      <mesh position={arrowTip} quaternion={quaternion}>
        <coneGeometry args={[0.09, 0.22, 10]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.5} />
      </mesh>
    </group>
  )
}

function SelectionMarker({ object, selected, onSelect }: { object: Learning3DObject; selected: boolean; onSelect: (id: string) => void }) {
  const center = regionCenterXZ(object)
  const height = BASE_ELEVATION[object.resourceType]
  return (
    <group position={[center.x, height, center.y]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[REGION_SIZE * 0.6, REGION_SIZE * 0.72, 32]} />
        <meshBasicMaterial color="#d4a017" transparent opacity={selected ? 1 : 0} />
      </mesh>
      {/* Invisible larger hit-target so clicking anywhere near the region selects it, since the ground itself is now one continuous mesh. */}
      <mesh
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(object.id)
        }}
      >
        <circleGeometry args={[REGION_SIZE * 0.75, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[0, 0.9, 0]} center distanceFactor={8} occlude>
        <span className="whitespace-nowrap rounded bg-white/85 px-1.5 py-0.5 font-campus-sans text-[11px] font-medium text-campus-ink-950">{object.label}</span>
      </Html>
    </group>
  )
}

interface SceneContentProps {
  spec: Learning3DVisualSpec
  currentQualities: Record<string, number>
  selectedObjectId: string | null
  onSelectObject: (id: string) => void
  animationTick: number
  reduceMotion: boolean
}

function SceneContent({ spec, currentQualities, selectedObjectId, onSelectObject, animationTick, reduceMotion }: SceneContentProps) {
  const { gl, invalidate } = useThree()
  const animatedQualitiesRef = useRef<Record<string, number>>({ ...currentQualities })
  const groundRecomputeRef = useRef<() => void>(() => {})
  const [, setRenderTick] = useState(0)

  useEffect(() => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  }, [gl])

  useEffect(() => {
    const proxy: Record<string, number> = {}
    spec.objects.forEach((o) => {
      proxy[o.id] = animatedQualitiesRef.current[o.id] ?? o.soilQuality
    })

    function applyAndRender() {
      groundRecomputeRef.current()
      setRenderTick((t) => t + 1)
      invalidate()
    }

    if (reduceMotion) {
      spec.objects.forEach((o) => {
        animatedQualitiesRef.current[o.id] = currentQualities[o.id] ?? o.soilQuality
      })
      applyAndRender()
      return
    }

    animate(proxy, {
      ...Object.fromEntries(spec.objects.map((o) => [o.id, currentQualities[o.id] ?? o.soilQuality])),
      duration: 900,
      ease: 'inOutQuad',
      onUpdate: () => {
        spec.objects.forEach((o) => {
          animatedQualitiesRef.current[o.id] = proxy[o.id]
        })
        applyAndRender()
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationTick])

  return (
    <>
      <ambientLight intensity={0.68} />
      <directionalLight position={[6, 8, 4]} intensity={0.9} castShadow shadow-mapSize={[1024, 1024]} />
      <GroundMesh spec={spec} qualitiesRef={animatedQualitiesRef} recomputeRef={groundRecomputeRef} />
      {spec.objects.map((object) => (
        <RegionCover key={object.id} object={object} quality={animatedQualitiesRef.current[object.id] ?? object.soilQuality} />
      ))}
      {spec.objectRelationships.map((rel, i) => (
        <FlowArrow key={i} spec={spec} relationship={rel} qualitiesRef={animatedQualitiesRef} />
      ))}
      {spec.objects.map((object) => (
        <SelectionMarker key={object.id} object={object} selected={selectedObjectId === object.id} onSelect={onSelectObject} />
      ))}
      <OrbitControls
        target={spec.camera.target}
        minDistance={spec.camera.minDistance}
        maxDistance={spec.camera.maxDistance}
        minPolarAngle={spec.camera.minPolarAngle}
        maxPolarAngle={spec.camera.maxPolarAngle}
        enablePan={false}
        makeDefault
      />
    </>
  )
}

export interface TerrainResourceSceneProps {
  spec: Learning3DVisualSpec
  currentQualities: Record<string, number>
  selectedObjectId: string | null
  onSelectObject: (id: string) => void
  /** Bumped by the parent whenever currentQualities changes, so the effect above knows to animate rather than merely re-render. */
  animationTick: number
  reduceMotion: boolean
}

/**
 * True-3D learning addendum — a genuine sloped terrain (not four isolated
 * coloured boxes): one continuous heightfield surface whose static
 * elevation comes from each region's real upland/valley position, vertex-
 * coloured by a live blend of soil quality, decorated with region-
 * appropriate cover (trees, crop-row blocks, mining debris, a catchment
 * pond), and connected by the spec's own authored objectRelationships
 * rendered as literal directional runoff/pressure/conservation arrows
 * down the slope — data that previously existed but was never drawn.
 * Anime.js (via 'animejs/adapters/three') owns the tween; React only
 * decides scene composition. frameloop="demand" plus invalidate() on
 * every tick keeps the GPU idle between genuine changes.
 */
export function TerrainResourceScene(props: TerrainResourceSceneProps) {
  return (
    <Canvas shadows camera={{ position: props.spec.camera.initialPosition, fov: 42 }} frameloop="demand" dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'low-power' }}>
      <SceneContent {...props} />
    </Canvas>
  )
}
