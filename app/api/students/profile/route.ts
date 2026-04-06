import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      country: string
      sector_interest: string
      current_study?: string
      self_assessed_skills?: Record<string, number>
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('student_profiles')
      .insert({
        country: body.country,
        sector_interest: body.sector_interest,
        self_assessed_skills: body.self_assessed_skills ?? {},
        vision_aligned_careers: [],
        skill_gap_score: null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
