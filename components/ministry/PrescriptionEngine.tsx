'use client'

import { useState, useCallback } from 'react'
import PrescriptionCard from './PrescriptionCard'
import type { Prescription } from './PrescriptionCard'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PrescriptionEngineProps {
  country: string
  sector: {
    id: string
    name: string
    current_workforce: number
    target_workforce: number
    target_year: number
  }
  accentColor: string
}

/* ------------------------------------------------------------------ */
/*  Skeleton card                                                      */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-28 rounded-full bg-slate-100" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="h-5 w-3/4 rounded bg-slate-100 mb-4" />
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-4/6 rounded bg-slate-100" />
      </div>
      <div className="flex gap-4 py-3 border-y border-slate-100 mb-4">
        <div className="h-10 w-16 rounded bg-slate-100" />
        <div className="h-10 w-16 rounded bg-slate-100" />
        <div className="h-10 w-16 rounded bg-slate-100" />
      </div>
      <div className="h-14 w-full rounded-lg bg-slate-50 mb-4" />
      <div className="flex gap-1.5 mb-4">
        <div className="h-5 w-14 rounded bg-slate-100" />
        <div className="h-5 w-14 rounded bg-slate-100" />
        <div className="h-5 w-14 rounded bg-slate-100" />
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 mb-4" />
      <div className="h-10 w-full rounded-lg bg-slate-100" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PrescriptionEngine({
  country,
  sector,
  accentColor,
}: PrescriptionEngineProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedFor, setGeneratedFor] = useState<string>('')
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null)

  const alreadyGenerated = generatedFor === sector.id && prescriptions.length > 0

  /* ------ Generate prescriptions ------ */
  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPrescriptions([])

    try {
      const res = await fetch('/api/prescriptions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          sector_id: sector.id,
          sector_name: sector.name,
          current_workforce: sector.current_workforce,
          target_workforce: sector.target_workforce,
          target_year: sector.target_year,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }

      const data = await res.json()
      const items: Prescription[] = data.prescriptions ?? data
      setPrescriptions(items)
      setGeneratedFor(sector.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }, [country, sector])

  /* ------ Simulation handler (Sprint 4 — coming soon) ------ */
  const handleRunSimulation = useCallback((_prescription: Prescription, cardIndex: number) => {
    setTooltipIndex(cardIndex)
    setTimeout(() => setTooltipIndex(null), 2500)
  }, [])

  /* ------ Gap info ------ */
  const gap = sector.target_workforce - sector.current_workforce
  const gapFormatted =
    gap >= 1_000_000
      ? `${(gap / 1_000_000).toFixed(1)}M`
      : gap >= 1_000
        ? `${(gap / 1_000).toFixed(1)}K`
        : gap.toLocaleString()

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-display text-lg text-slate-900">
            Prescription Engine
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Generate AI-driven policy prescriptions to close the{' '}
            <span className="font-medium text-slate-500">{gapFormatted}</span>{' '}
            workforce gap in {sector.name} by {sector.target_year}.
          </p>
        </div>
      </div>

      {/* ---- Generate button ---- */}
      {!loading && !alreadyGenerated && (
        <button
          type="button"
          onClick={generate}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: accentColor }}
        >
          Generate Prescriptions
        </button>
      )}

      {/* ---- Re-generate button (when already generated) ---- */}
      {!loading && alreadyGenerated && (
        <button
          type="button"
          onClick={generate}
          className="rounded-lg px-5 py-2.5 text-sm font-medium border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 mb-6"
        >
          Re-generate Prescriptions
        </button>
      )}

      {/* ---- Loading skeletons ---- */}
      {loading && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${accentColor} transparent ${accentColor} ${accentColor}` }}
            />
            <span className="text-sm text-slate-500">
              Generating prescriptions for {sector.name}...
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* ---- Error state ---- */}
      {error && !loading && (
        <div className="mt-6 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-sm text-red-600 font-medium mb-1">
            Failed to generate prescriptions
          </p>
          <p className="text-sm text-red-500">{error}</p>
          <button
            type="button"
            onClick={generate}
            className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ---- Prescription cards ---- */}
      {!loading && prescriptions.length > 0 && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {prescriptions.map((rx, i) => (
            <div key={`${rx.title}-${i}`} className="relative">
              <PrescriptionCard
                prescription={rx}
                accentColor={accentColor}
                index={i}
                onRunSimulation={(p) => handleRunSimulation(p, i)}
              />
              {/* Coming soon tooltip — Sprint 4 */}
              {tooltipIndex === i && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs text-white shadow-lg animate-fade-in">
                  Deep Simulation coming in Sprint 4
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
