'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import RoleSelector from '@/components/layout/RoleSelector'
import type { Scenario } from '@/lib/types'

const ACCENT: Record<string, string> = {
  malta: '#1B6B5A',
  saudi: '#C9A84C',
}

export default function ScenarioDetailPage() {
  const params = useParams()
  const country = params.country as string
  const scenarioId = params.id as string
  const accentColor = ACCENT[country] || '#C9A84C'

  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadScenario() {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from('scenarios')
        .select('*, sectors(name)')
        .eq('id', scenarioId)
        .single()

      if (data) setScenario(data)
      setLoading(false)
    }
    loadScenario()
  }, [scenarioId])

  if (loading) {
    return (
      <div className="p-8">
        <RoleSelector role="Ministry" accentColor={accentColor} />
        <div className="mt-8 animate-pulse-subtle">
          <div className="h-8 bg-gray-200 rounded w-64" />
        </div>
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="p-8">
        <RoleSelector role="Ministry" accentColor={accentColor} />
        <div className="mt-8 bg-white rounded-lg border border-[#E2E5EB] p-8 text-center">
          <p className="text-[#5A6478]">Scenario not found</p>
        </div>
      </div>
    )
  }

  const outcomes = scenario.projected_outcomes as Record<string, unknown> | null

  return (
    <div className="p-8">
      <RoleSelector role="Ministry" accentColor={accentColor} />

      <div className="mt-6">
        <h1 className="font-display text-3xl text-[#0A1628]">{scenario.name}</h1>
        <p className="text-[#5A6478] mt-1 text-sm">
          Saved scenario analysis — {new Date(scenario.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-8">
        <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
          <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Intervention Type</p>
          <p className="font-display text-xl mt-1 capitalize">{scenario.intervention_type?.replace(/_/g, ' ')}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
          <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Gap Closure</p>
          <p className="font-display text-xl mt-1">{scenario.gap_closure_percentage}%</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
          <p className="text-[#8B95A8] text-xs uppercase tracking-wider">Estimated Cost</p>
          <p className="font-display text-xl mt-1">${scenario.cost_estimate_usd?.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E5EB] p-5">
          <p className="text-[#8B95A8] text-xs uppercase tracking-wider">5-Year ROI</p>
          <p className="font-display text-xl mt-1">{scenario.roi_5year}x</p>
        </div>
      </div>

      {scenario.ai_analysis && (
        <div className="mt-8 bg-white rounded-lg border border-[#E2E5EB] p-6">
          <h3 className="font-display text-xl mb-3">AI Analysis</h3>
          <p className="text-[#5A6478] text-sm leading-relaxed">{scenario.ai_analysis}</p>
        </div>
      )}

      {outcomes && (
        <div className="mt-6 bg-white rounded-lg border border-[#E2E5EB] p-6">
          <h3 className="font-display text-xl mb-3">Projected Outcomes</h3>
          <pre className="text-xs text-[#5A6478] overflow-auto bg-[#F4F5F7] p-4 rounded">
            {JSON.stringify(outcomes, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
