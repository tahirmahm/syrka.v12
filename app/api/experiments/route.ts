import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const VALID_METRICS = [
  'employment_velocity',
  'mastery_gain',
  'dropout_risk',
  'ai_orchestration_score',
]

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country') || 'saudi'
  const supabase = createClient()

  const { data, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('country', country)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, hypothesis, metric, target_value, promote_threshold, rollback_threshold, country } = body

  if (!name || !hypothesis || !metric) {
    return NextResponse.json({ error: 'name, hypothesis, and metric are required' }, { status: 400 })
  }

  if (!VALID_METRICS.includes(metric)) {
    return NextResponse.json(
      { error: `Invalid metric. Must be one of: ${VALID_METRICS.join(', ')}` },
      { status: 400 }
    )
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('experiments')
    .insert({
      name,
      hypothesis,
      metric,
      target_value: target_value || 0,
      promote_threshold: promote_threshold || 80,
      rollback_threshold: rollback_threshold || 30,
      country: country || 'saudi',
      status: 'draft',
      current_value: 0,
      outcome_log: [],
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
