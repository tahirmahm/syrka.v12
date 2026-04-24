import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const VISION_LABELS: Record<string, string> = {
  saudi: "Saudi Arabia's Vision 2030",
  malta: "Malta's Vision 2050",
  uk: "the UK AI Opportunities Action Plan 2030",
}

export async function POST(req: NextRequest) {
  try {
    const { skills, completedModules, timeAvailable, targetRole, country } = await req.json()

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `You are an adaptive learning path engine for Syrka, aligned with ${VISION_LABELS[country] || VISION_LABELS.saudi}. A student has these current skills: ${(skills || []).join(', ')}. They have completed: ${(completedModules || []).join(', ') || 'nothing yet'}. Their target role is ${targetRole || 'not specified'}. They have ${timeAvailable || 'medium'} time to study. Generate a personalised 90-day learning path with:
- week_ranges: array of { weeks: string, focus: string, actions: string[], resources: string[], skills_unlocked: string[] }
- immediate_action: string (what to do TODAY, specific)
- velocity_assessment: 'ahead' | 'on_track' | 'behind'
- velocity_reasoning: string
- bottleneck: string (the single skill gap blocking the most progress)
- shortcut: string (fastest path to minimum viable qualification)
Return ONLY valid JSON.`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.5,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    let path: Record<string, unknown>
    try {
      path = JSON.parse(content.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({ error: 'Failed to parse learning path' }, { status: 500 })
    }

    return NextResponse.json(path)
  } catch (err) {
    console.error('adaptive-path error:', err)
    return NextResponse.json({ error: 'Path generation failed' }, { status: 500 })
  }
}
