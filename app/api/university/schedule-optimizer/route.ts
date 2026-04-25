import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  try {
    const { courses, constraints, semester, country } = await req.json()

    if (!courses || courses.length === 0) {
      return NextResponse.json({ error: 'courses array is required' }, { status: 400 })
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    const supabase = createClient()

    const { data: enrollments } = await supabase
      .from('course_skills')
      .select('course_id, skills(name)')
      .in('course_id', courses.map((c: { id: string }) => c.id || c))

    const enrollmentContext = (enrollments || []).map((e) => {
      const s = e.skills as unknown as { name: string } | null
      return `Course ${e.course_id}: teaches ${s?.name || 'unknown'}`
    }).join('\n')

    const startTime = Date.now()
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `You are a university scheduling optimizer. Given these courses and constraints, generate an optimal schedule that maximises learning velocity and minimises skill prerequisite conflicts.

COURSES:
${courses.map((c: { id?: string; name?: string; credits?: number }) => `- ${c.name || c.id} (${c.credits || 3} credits)`).join('\n')}

SKILL CONTEXT:
${enrollmentContext || 'No skill data available'}

CONSTRAINTS:
${constraints || 'No specific constraints'}

SEMESTER: ${semester || 'Fall 2026'}

Generate an optimised schedule as JSON:
{
  "schedule": [
    {
      "slot": "Monday 09:00-10:30",
      "course": "Course Name",
      "reason": "Why this slot — prerequisite ordering, cognitive load, etc."
    }
  ],
  "conflicts_resolved": ["string"],
  "skill_flow_order": ["string — skills taught in dependency order"],
  "cognitive_load_assessment": "string — assessment of daily cognitive load balance",
  "optimization_score": number (0-100),
  "recommendations": ["string — 2-3 scheduling recommendations"]
}

Return ONLY valid JSON.`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.4,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    let schedule: Record<string, unknown>
    try {
      schedule = JSON.parse(content.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({ error: 'Failed to parse schedule' }, { status: 500 })
    }

    logAudit({
      endpoint: '/api/university/schedule-optimizer',
      request_payload: { courseCount: courses.length, semester, country },
      response_payload: { optimization_score: schedule.optimization_score },
      model_used: 'deepseek-chat', latency_ms: Date.now() - startTime,
      tokens_used: completion.usage?.total_tokens || 0,
      country, track: 'university',
    })

    return NextResponse.json(schedule)
  } catch (err) {
    console.error('schedule-optimizer error:', err)
    return NextResponse.json({ error: 'Schedule optimization failed' }, { status: 500 })
  }
}
