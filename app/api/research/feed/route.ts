import { NextRequest, NextResponse } from 'next/server'
import { getModule } from '@/lib/degree-config'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const moduleCode = req.nextUrl.searchParams.get('module')
  if (!moduleCode) {
    return NextResponse.json({ error: 'module param required' }, { status: 400 })
  }

  const mod = getModule(moduleCode)
  if (!mod) {
    return NextResponse.json({ error: 'Unknown module' }, { status: 404 })
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('research_feed_cache')
      .select('papers, field_velocity, last_updated, next_update')
      .eq('module_code', moduleCode)
      .single()

    if (error || !data) {
      return NextResponse.json({
        module: moduleCode,
        papers: [],
        field_velocity: 0,
        cached: false,
        message: 'No cached feed — trigger /api/cron/research-update to populate',
      })
    }

    return NextResponse.json({
      module: moduleCode,
      papers: data.papers,
      field_velocity: data.field_velocity,
      last_updated: data.last_updated,
      next_update: data.next_update,
      cached: true,
    })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}
