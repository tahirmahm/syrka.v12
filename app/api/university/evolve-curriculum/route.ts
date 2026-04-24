import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase'

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

        await supabase.from('curriculum_evolution_log').insert({
          course_id: course.id,
          recommendations,
          generated_at: new Date().toISOString(),
          model_version: 'deepseek-chat',
        })

        evolved++
      } catch (err) {
        console.error(`Evolution failed for course ${course.id}:`, err)
      }
    }

    return NextResponse.json({ evolved })
  } catch (err) {
    console.error('evolve-curriculum error:', err)
    return NextResponse.json({ evolved: 0, error: 'Evolution failed' }, { status: 500 })
  }
}
