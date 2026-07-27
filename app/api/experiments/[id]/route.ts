import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const supabase = createClient()

  const update: Record<string, unknown> = {}
  if (body.status) update.status = body.status
  if (typeof body.current_value === 'number') update.current_value = body.current_value

  const { data: existing } = await supabase
    .from('experiments')
    .select('promote_threshold, rollback_threshold')
    .eq('id', id)
    .single()

  if (existing && typeof body.current_value === 'number') {
    if (body.current_value >= (existing.promote_threshold || 80)) {
      update.status = 'promoted'
    } else if (body.current_value <= (existing.rollback_threshold || 30)) {
      update.status = 'rolled_back'
    }
  }

  const { data, error } = await supabase
    .from('experiments')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const supabase = createClient()

  const { data: experiment } = await supabase
    .from('experiments')
    .select('outcome_log, promote_threshold, rollback_threshold')
    .eq('id', id)
    .single()

  if (!experiment) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  const newEntry = {
    value: body.value,
    note: body.note || '',
    recorded_at: new Date().toISOString(),
  }

  const log = [...((experiment.outcome_log as unknown[]) || []), newEntry]
  const recentValues = log
    .slice(-3)
    .map((e) => (e as { value: number }).value)
    .filter((v) => typeof v === 'number')
  const currentValue =
    recentValues.length > 0
      ? Math.round(recentValues.reduce((a, b) => a + b, 0) / recentValues.length)
      : 0

  const update: Record<string, unknown> = {
    outcome_log: log,
    current_value: currentValue,
  }

  if (currentValue >= (experiment.promote_threshold || 80)) {
    update.status = 'promoted'
  } else if (currentValue <= (experiment.rollback_threshold || 30)) {
    update.status = 'rolled_back'
  }

  const { data, error } = await supabase
    .from('experiments')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
