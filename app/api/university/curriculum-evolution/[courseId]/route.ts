import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('curriculum_evolution_log')
      .select('*')
      .eq('course_id', params.courseId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) {
      return NextResponse.json({ evolution: null })
    }

    return NextResponse.json({ evolution: data })
  } catch (err) {
    console.error('curriculum-evolution GET error:', err)
    return NextResponse.json({ evolution: null })
  }
}
