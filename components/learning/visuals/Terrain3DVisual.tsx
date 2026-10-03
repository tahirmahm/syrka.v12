'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { Play, Pause, ArrowClockwise, CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe'
import type { Learning3DVisualSpec } from '@/lib/campus-types/learning-3d-visual-spec'
import type { TerrainResourceSceneProps } from './three/TerrainResourceScene'

const TerrainResourceScene = dynamic<TerrainResourceSceneProps>(
  () => import('./three/TerrainResourceScene').then((m) => m.TerrainResourceScene),
  { ssr: false, loading: () => <Skeleton className="h-[360px] w-full" /> }
)

function isWebGL2Available(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

export interface Terrain3DVisualProps {
  spec: Learning3DVisualSpec
}

/**
 * True-3D learning addendum — the accessible control shell around the
 * lazy-loaded R3F scene. The Tutor explains why 3D was chosen for this
 * concept (see representation-router.ts's three_scene branch); this
 * component only handles the interaction contract: select a region,
 * change one variable (apply conservation at Year 5, yes/no), predict,
 * play/pause/step, compare before/after, then a transfer prompt that is
 * explicitly NOT wired to Evidence (same disclosure pattern as
 * EconomicsCreditSimulator — the real Evidence-bearing attempt is the
 * concept's own Test step, which never renders this visual).
 */
export function Terrain3DVisual({ spec }: Terrain3DVisualProps) {
  const reduceMotion = useReducedMotionSafe()
  const [webglAvailable] = useState(isWebGL2Available)
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(spec.objects[0]?.id ?? null)
  const [applyConservation, setApplyConservation] = useState<boolean | null>(null)
  const [stageIndex, setStageIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [prediction, setPrediction] = useState('')
  const [transferResponse, setTransferResponse] = useState('')
  const [compareMode, setCompareMode] = useState(false)

  const activeStages = useMemo(() => {
    const baseline = spec.animationStages.find((s) => s.id === 'stage-baseline')!
    const extraction = spec.animationStages.find((s) => s.id === 'stage-extraction')!
    const outcome = spec.animationStages.find((s) => s.id === (applyConservation ? 'stage-conservation' : 'stage-degraded'))!
    return [baseline, extraction, outcome]
  }, [spec, applyConservation])

  const currentStage = activeStages[stageIndex]
  const currentQualities = compareMode ? activeStages[0].objectSoilQualityTargets : currentStage.objectSoilQualityTargets
  const animationTick = stageIndex + (compareMode ? 100 : 0) + (applyConservation ? 0 : 1000)

  const canPlay = applyConservation !== null

  function handleStep(direction: 1 | -1) {
    setCompareMode(false)
    setStageIndex((i) => Math.min(Math.max(i + direction, 0), activeStages.length - 1))
  }
  function handlePlay() {
    if (!canPlay) return
    setCompareMode(false)
    if (stageIndex >= activeStages.length - 1) setStageIndex(0)
    setPlaying(true)
  }
  function handleReset() {
    setPlaying(false)
    setCompareMode(false)
    setStageIndex(0)
  }

  useEffect(() => {
    if (!playing) return
    if (stageIndex >= activeStages.length - 1) {
      setPlaying(false)
      return
    }
    // Simple discrete auto-advance — each stage holds for a beat once played.
    const timer = setTimeout(() => setStageIndex((i) => Math.min(i + 1, activeStages.length - 1)), 1400)
    return () => clearTimeout(timer)
  }, [playing, stageIndex, activeStages.length])

  const predictHook = spec.assessmentHooks.find((h) => h.purpose === 'predict')
  const transferHook = spec.assessmentHooks.find((h) => h.purpose === 'transfer')
  const selectedObject = spec.objects.find((o) => o.id === selectedObjectId)

  return (
    <figure className="flex flex-col gap-4 rounded-campus-md border border-campus-border bg-campus-surface p-4">
      <figcaption className="flex items-center justify-between gap-2">
        <span className="font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">{spec.title}</span>
        <Badge tone="neutral">3D terrain model</Badge>
      </figcaption>

      {webglAvailable ? (
        <div className="overflow-hidden rounded-campus-sm border border-campus-border" style={{ height: 360 }} role="img" aria-label={spec.altText}>
          <TerrainResourceScene
            spec={spec}
            currentQualities={currentQualities}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            animationTick={animationTick}
            reduceMotion={reduceMotion}
          />
        </div>
      ) : (
        <p role="status" className="rounded-campus-sm border border-campus-amber-600/40 bg-campus-surface-raised p-3 font-campus-sans text-campus-sm text-campus-text dark:border-campus-amber-dark/40">
          This device or browser cannot render the 3D model, so here is the same content as text: {spec.structuredFallback}
        </p>
      )}

      <div className="border-t border-campus-border pt-3">
        <p className="mb-1.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">1. Select a region (keyboard-accessible list — mirrors clicking a parcel above)</p>
        <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Land parcels">
          {spec.objects.map((object) => (
            <button
              key={object.id}
              type="button"
              role="option"
              aria-selected={selectedObjectId === object.id}
              onClick={() => setSelectedObjectId(object.id)}
              className={`rounded-campus-sm border px-2.5 py-1 font-campus-sans text-campus-xs ${
                selectedObjectId === object.id ? 'border-campus-ink-950 bg-campus-surface-raised dark:border-campus-stone-100' : 'border-campus-border hover:bg-campus-surface-raised'
              }`}
            >
              {object.label}
            </button>
          ))}
        </div>
        {selectedObject && (
          <p className="mt-1.5 font-campus-sans text-campus-xs text-campus-muted">
            {selectedObject.label} — current soil quality at this stage: <span className="tabular-nums text-campus-text">{currentQualities[selectedObject.id]?.toFixed(2)}</span>
          </p>
        )}
      </div>

      <div className="border-t border-campus-border pt-3">
        <p className="mb-1.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">2. Change one variable</p>
        <div className="flex gap-1.5">
          {[
            { value: true, label: 'Apply conservation at Year 5' },
            { value: false, label: 'No conservation measures' },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={applyConservation === opt.value}
              onClick={() => {
                setApplyConservation(opt.value)
                setStageIndex(0)
                setPlaying(false)
                setCompareMode(false)
              }}
              className={`rounded-campus-sm border px-2.5 py-1.5 font-campus-sans text-campus-xs ${
                applyConservation === opt.value ? 'border-campus-ink-950 bg-campus-surface-raised dark:border-campus-stone-100' : 'border-campus-border hover:bg-campus-surface-raised'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {canPlay && predictHook && stageIndex === 0 && !playing && (
        <div className="border-t border-campus-border pt-3">
          <p className="mb-1.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">3. Predict, before playing</p>
          <p className="mb-1.5 font-campus-sans text-campus-sm text-campus-text">{predictHook.prompt}</p>
          <textarea
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            rows={2}
            placeholder="Your prediction…"
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
        </div>
      )}

      <div className="border-t border-campus-border pt-3">
        <p className="mb-1.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">4. Play, pause, step, or compare</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="secondary" disabled={!canPlay} onClick={() => handleStep(-1)} icon={<CaretLeft size={13} />} aria-label="Step back">
            Back
          </Button>
          <Button size="sm" variant={playing ? 'secondary' : 'primary'} disabled={!canPlay} onClick={playing ? () => setPlaying(false) : handlePlay} icon={playing ? <Pause size={13} weight="fill" /> : <Play size={13} weight="fill" />}>
            {playing ? 'Pause' : 'Play'}
          </Button>
          <Button size="sm" variant="secondary" disabled={!canPlay} onClick={() => handleStep(1)} icon={<CaretRight size={13} />} aria-label="Step forward">
            Forward
          </Button>
          <Button size="sm" variant="ghost" disabled={!canPlay} onClick={handleReset} icon={<ArrowClockwise size={13} />}>
            Reset
          </Button>
          <Button size="sm" variant={compareMode ? 'secondary' : 'ghost'} disabled={!canPlay} onClick={() => setCompareMode((v) => !v)}>
            {compareMode ? 'Showing Year 0' : 'Compare with Year 0'}
          </Button>
        </div>
        {canPlay && (
          <div className="mt-2 rounded-campus-sm bg-campus-surface-raised p-2.5">
            <p className="font-campus-sans text-campus-sm font-medium text-campus-text">{compareMode ? activeStages[0].label : currentStage.label}</p>
            <p className="mt-0.5 font-campus-sans text-campus-xs text-campus-muted">{compareMode ? activeStages[0].narration : currentStage.narration}</p>
          </div>
        )}
        {!canPlay && <p className="font-campus-sans text-campus-xs text-campus-muted">Choose a conservation option above to unlock playback.</p>}
      </div>

      <div className="border-t border-campus-border pt-3">
        <p className="mb-1.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Structured text equivalent</p>
        <p className="font-campus-sans text-campus-xs text-campus-muted">{spec.structuredFallback}</p>
      </div>

      {transferHook && (
        <div className="border-t border-campus-border pt-3">
          <p className="mb-1.5 font-campus-mono text-[10px] uppercase tracking-wide text-campus-muted">Independent transfer (exploratory)</p>
          <p className="mb-1.5 font-campus-sans text-campus-sm text-campus-text">{transferHook.prompt}</p>
          <textarea
            value={transferResponse}
            onChange={(e) => setTransferResponse(e.target.value)}
            rows={3}
            placeholder="Your explanation…"
            className="w-full rounded-campus-sm border border-campus-border bg-campus-surface px-3 py-2 font-campus-sans text-campus-sm text-campus-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-blue-600"
          />
          {transferResponse.trim().length > 20 && (
            <p className="mt-1.5 font-campus-sans text-campus-xs text-campus-muted">
              This exploratory interactive is not connected to the concept&rsquo;s own Evidence chain — complete the Test step below for a transfer attempt that counts toward Evidence.
            </p>
          )}
        </div>
      )}
    </figure>
  )
}
