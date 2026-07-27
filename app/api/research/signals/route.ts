import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('research_feed_cache')
      .select('module_code, papers, field_velocity, last_updated')
      .order('field_velocity', { ascending: false })

    if (error) {
      return NextResponse.json({ signals: [] })
    }

    const signals = (data ?? []).map(row => {
      const papers = (row.papers as unknown[]) ?? []
      const topPaper = papers.length > 0
        ? (papers[0] as { title?: string }).title
        : undefined

      return {
        module_code: row.module_code,
        field_velocity: row.field_velocity ?? 0,
        paper_count: papers.length,
        top_paper: topPaper,
        last_updated: row.last_updated,
      }
    })

    return NextResponse.json({ signals })
  } catch {
    return NextResponse.json({ signals: [] })
  }
}
