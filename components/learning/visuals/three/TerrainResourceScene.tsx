'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { animate } from 'animejs'
import 'animejs/adapters/three'
import type { Learning3DVisualSpec } from '@/lib/campus-types/learning-3d-visual-spec'

const REGION_SIZE = 1.6
const REGION_GAP = 0.3
const MAX_HEIGHT = 1.8
const MIN_HEIGHT = 0.15

const HEALTHY_COLOR = new THREE.Color('#5a8f5a')
const DEGRADED_COLOR = new THREE.Color('#8a6a45')

function qualityToHeight(quality: number): number {
  return MIN_HEIGHT + quality * (MAX_HEIGHT - MIN_HEIGHT)
}

function qualityToColor(quality: number): THREE.Color {
  return DEGRADED_COLOR.clone().lerp(HEALTHY_COLOR, quality)
}

interface RegionMeshProps {
  spec: Learning3DVisualSpec
  objectId: string
  targetQuality: number
  selected: boolean
  onSelect: (id: string) => void
  registerMesh: (id: string, mesh: THREE.Mesh | null) => void
}

function RegionMesh({ spec, objectId, targetQuality, selected, onSelect, registerMesh }: RegionMeshProps) {
  const object = spec.objects.find((o) => o.id === objectId)!
  const meshRef = useRef<THREE.Mesh>(null)
  const x = object.gridPosition.col * (REGION_SIZE + REGION_GAP)
  const z = object.gridPosition.row * (REGION_SIZE + REGION_GAP)

  useEffect(() => {
    registerMesh(objectId, meshRef.current)
    return () => registerMesh(objectId, null)
  }, [objectId, registerMesh])

  const initialHeight = qualityToHeight(targetQuality)

  return (
    <group position={[x, 0, z]}>
      <mesh
        ref={meshRef}
        position={[0, initialHeight / 2, 0]}
        scale={[1, initialHeight, 1]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(objectId)
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[REGION_SIZE, 1, REGION_SIZE]} />
        <meshStandardMaterial color={qualityToColor(targetQuality)} roughness={0.85} />
      </mesh>
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[REGION_SIZE * 0.62, REGION_SIZE * 0.72, 32]} />
          <meshBasicMaterial color="#d4a017" />
        </mesh>
      )}
      {/* Html (a positioned DOM node), not drei's Text, avoids Text's runtime dependency on a remote CDN font-fallback fetch — this label needs no network access. */}
      <Html position={[0, MAX_HEIGHT + 0.5, 0]} center distanceFactor={8} occlude>
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

/**
 * Rendered inside <Canvas>, so useThree() (needed for both the capped
 * device-pixel-ratio setting and manually invalidating the on-demand
 * frameloop after each Anime.js tick) is available here.
 */
function SceneContent({ spec, currentQualities, selectedObjectId, onSelectObject, animationTick, reduceMotion }: SceneContentProps) {
  const { gl, invalidate } = useThree()
  const meshesRef = useRef<Record<string, THREE.Mesh | null>>({})

  useEffect(() => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  }, [gl])

  const registerMesh = useMemo(
    () => (id: string, mesh: THREE.Mesh | null) => {
      meshesRef.current[id] = mesh
    },
    []
  )

  useEffect(() => {
    for (const object of spec.objects) {
      const mesh = meshesRef.current[object.id]
      const quality = currentQualities[object.id]
      if (!mesh || quality === undefined) continue
      const height = qualityToHeight(quality)
      const color = qualityToColor(quality)
      const material = mesh.material as THREE.MeshStandardMaterial

      if (reduceMotion) {
        mesh.scale.set(1, height, 1)
        mesh.position.y = height / 2
        material.color.copy(color)
        invalidate()
        continue
      }

      const onUpdate = () => invalidate()
      animate(mesh.scale, { y: height, duration: 900, ease: 'inOutQuad', onUpdate })
      animate(mesh.position, { y: height / 2, duration: 900, ease: 'inOutQuad', onUpdate })
      animate(material.color, { r: color.r, g: color.g, b: color.b, duration: 900, ease: 'inOutQuad', onUpdate })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationTick, reduceMotion])

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 8, 4]} intensity={0.9} castShadow shadow-mapSize={[1024, 1024]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.5, -0.02, 1]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#e7e2d6" />
      </mesh>
      {spec.objects.map((object) => (
        <RegionMesh
          key={object.id}
          spec={spec}
          objectId={object.id}
          targetQuality={currentQualities[object.id] ?? object.soilQuality}
          selected={selectedObjectId === object.id}
          onSelect={onSelectObject}
          registerMesh={registerMesh}
        />
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
 * True-3D learning addendum — the actual R3F scene, dynamically imported
 * only from Terrain3DVisual (never in the ordinary concept bundle). Anime.js
 * (via its official 'animejs/adapters/three' side-effect import) is the
 * sole owner of per-object scale/position/colour transforms here — React
 * only decides scene composition (which objects exist, which is selected);
 * Motion and GSAP never touch these Object3D instances (see ADR's 3D
 * ownership rule). Anime.js's target detection covers Vector3 (mesh.scale,
 * mesh.position) and Color (material.color) directly, so no
 * flattened-property-name guessing is needed. frameloop="demand" plus a
 * manual invalidate() on every Anime.js tick keeps the GPU idle between
 * genuine changes instead of rendering an unconditional 60fps loop.
 */
export function TerrainResourceScene(props: TerrainResourceSceneProps) {
  return (
    <Canvas shadows camera={{ position: props.spec.camera.initialPosition, fov: 42 }} frameloop="demand" dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'low-power' }}>
      <SceneContent {...props} />
    </Canvas>
  )
}
