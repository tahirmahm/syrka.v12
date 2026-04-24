import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: recentOutcomes } = await supabase
      .from('application_outcomes')
      .select('*')
      .gte('created_at', sevenDaysAgo)

    if (!recentOutcomes || recentOutcomes.length === 0) {
      return NextResponse.json({ processed: 0 })
    }

    const byUser: Record<string, typeof recentOutcomes> = {}
    for (const o of recentOutcomes) {
      const uid = o.user_id as string
      if (!uid) continue
      if (!byUser[uid]) byUser[uid] = []
      byUser[uid].push(o)
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ processed: 0, error: 'AI service not configured' })
    }

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    let processed = 0
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)

    for (const [userId, outcomes] of Object.entries(byUser)) {
      const total = outcomes.length
      const responses = outcomes.filter(o => o.status !== 'applied' && o.status !== 'ghosted').length
      const rejections = outcomes.filter(o => o.status === 'rejected').length
      const interviews = outcomes.filter(o => ['interview', 'offer'].includes(o.status)).length

      const missingSkills: Record<string, number> = {}
      const askedSkills: Record<string, number> = {}
      for (const o of outcomes) {
        for (const s of (o.skills_i_lacked as string[]) || []) {
          missingSkills[s] = (missingSkills[s] || 0) + 1
        }
        for (const s of (o.skills_they_asked_about as string[]) || []) {
          askedSkills[s] = (askedSkills[s] || 0) + 1
        }
      }

      const topMissing = Object.entries(missingSkills).sort(([, a], [, b]) => b - a).slice(0, 5).map(([s]) => s)
      const topAsked = Object.entries(askedSkills).sort(([, a], [, b]) => b - a).slice(0, 5).map(([s]) => s)

      try {
        const completion = await client.chat.completions.create({
          model: 'deepseek-chat',
          messages: [{
            role: 'user',
            content: `This student sent ${total} applications this week.
Responses: ${responses}. Rejections: ${rejections}. Interviews reached: ${interviews}.
Most commonly missing skills across rejections: ${topMissing.join(', ') || 'none identified'}.
Most commonly asked skills across all applications: ${topAsked.join(', ') || 'none identified'}.

Generate their weekly learning priority as JSON:
{
  "weekFocus": "string",
  "topThreeActions": ["string", "string", "string"],
  "skillToDropEverythingFor": "string",
  "encouragement": "string",
  "projectedOutcomeIfFollowed": "string",
  "warningSign": "string or null"
}
Return ONLY the JSON.`,
          }],
          max_tokens: 600,
          temperature: 0.4,
        })

        const content = completion.choices[0]?.message?.content || '{}'
        let signal: Record<string, unknown> = {}
        try {
          signal = JSON.parse(content.replace(/```json|```/g, '').trim())
        } catch {}

        await supabase.from('learning_signals').upsert({
          user_id: userId,
          week_start: weekStart.toISOString().split('T')[0],
          applications_sent: total,
          responses_received: responses,
          rejections,
          interviews,
          top_missing_skills: topMissing,
          top_asked_skills: topAsked,
          recommended_focus: signal,
          signal_strength: Math.min(10, total),
          generated_at: new Date().toISOString(),
        })

        processed++
      } catch (err) {
        console.error(`Weekly signal failed for user ${userId}:`, err)
      }
    }

    return NextResponse.json({ processed })
  } catch (err) {
    console.error('weekly-signal error:', err)
    return NextResponse.json({ processed: 0, error: 'Signal generation failed' }, { status: 500 })
  }
}
