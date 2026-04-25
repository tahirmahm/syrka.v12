import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()

    const { data: courses } = await supabase
      .from('courses')
      .select('id, name, code, description')

    if (!courses || courses.length === 0) {
      return NextResponse.json({ evolved: 0 })
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ evolved: 0, error: 'AI service not configured' })
    }

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    let evolved = 0

    for (const course of courses) {
      try {
        const completion = await client.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: `You are an academic curriculum intelligence engine. Given this course: "${course.name}" (${course.code || 'no code'}) — ${course.description || 'no description'}, generate 3 updated reading recommendations that reflect the most important developments in this field in the last 90 days. Each recommendation must include:
- title: string
- authors: string
- why_now: string (one sentence — why this matters right now)
- esco_skills: string[] (2-3 ESCO skill codes this develops)
- difficulty: 'foundational' | 'intermediate' | 'advanced'
- sources: array of { year: number, publication: string, doi_or_url: string, confidence: 'high' | 'medium' | 'low', freshness_signal: string }
Return ONLY a JSON array of 3 objects.`,
            },
          ],
          max_tokens: 1000,
          temperature: 0.6,
        })

        const content = completion.choices[0]?.message?.content || '[]'
        let recommendations: unknown[]
        try {
          recommendations = JSON.parse(content.replace(/```json|```/g, '').trim())
        } catch {
          recommendations = []
        }

        const allSources = (recommendations as Record<string, unknown>[]).flatMap(
          (r) => (r.sources as { year?: number }[]) || []
        )
        const currentYear = new Date().getFullYear()
        const avgAge = allSources.length > 0
          ? allSources.reduce((sum, s) => sum + (currentYear - (s.year || currentYear)), 0) / allSources.length
          : 5
        const freshnessScore = Math.max(0, Math.min(1, 1 - avgAge / 10))

        await supabase.from('curriculum_evolution_log').insert({
          course_id: course.id,
          recommendations,
          sources: allSources,
          freshness_score: freshnessScore,
          provenance_verified: false,
          generated_at: new Date().toISOString(),
          model_version: 'deepseek-chat',
        })

        evolved++
      } catch (err) {
        console.error(`Evolution failed for course ${course.id}:`, err)
      }
    }

    logAudit({
      endpoint: '/api/university/evolve-curriculum',
      request_payload: { courseCount: courses.length },
      response_payload: { evolved },
      model_used: 'deepseek-chat', latency_ms: 0,
      tokens_used: 0, track: 'university',
    })

    return NextResponse.json({ evolved })
  } catch (err) {
    console.error('evolve-curriculum error:', err)
    return NextResponse.json({ evolved: 0, error: 'Evolution failed' }, { status: 500 })
  }
}
