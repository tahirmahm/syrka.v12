import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { courseId, courseName, courseDescription } = await req.json()

    if (!courseId || !courseName) {
      return NextResponse.json(
        { error: 'courseId and courseName are required' },
        { status: 400 }
      )
    }

    const searchText = courseDescription
      ? `${courseName} ${courseDescription}`
      : courseName

    const escoUrl = `https://ec.europa.eu/esco/api/search?text=${encodeURIComponent(searchText)}&type=skill&language=en&limit=10`
    const escoRes = await fetch(escoUrl, {
      headers: { Accept: 'application/json' },
    })

    if (!escoRes.ok) {
      return NextResponse.json(
        { error: `ESCO API error: HTTP ${escoRes.status}` },
        { status: 502 }
      )
    }

    const escoData = await escoRes.json()
    const results = escoData?._embedded?.results ?? []

    if (results.length === 0) {
      return NextResponse.json({ mappings: [], message: 'No ESCO skills found' })
    }

    const mappings = results.map((result: { uri: string; title: string }, index: number) => ({
      course_id: courseId,
      esco_skill_uri: result.uri,
      esco_skill_label: result.title,
      relevance_score: Math.max(0.1, parseFloat((1.0 - index * 0.1).toFixed(2))),
      mapped_at: new Date().toISOString(),
    }))

    const supabase = createClient()

    const { data, error } = await supabase
      .from('course_skill_mappings')
      .upsert(mappings, {
        onConflict: 'course_id,esco_skill_uri',
      })
      .select()

    if (error) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      mappings: data,
      count: mappings.length,
      source: 'esco',
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
