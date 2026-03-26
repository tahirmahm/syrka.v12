import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createDeepSeekClient } from '@/lib/deepseek'

export async function POST(req: NextRequest) {
  try {
    const { programmeId } = await req.json()
    const supabase = createClient()
    const cacheKey = `curriculum-${programmeId}`

    const { data: cached } = await supabase
      .from('ai_cache')
      .select('result')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cached) return NextResponse.json(cached.result)

    const { data: programme } = await supabase
      .from('programmes')
      .select('*, institutions(*, national_visions(*))')
      .eq('id', programmeId)
      .single()

    if (!programme) {
      return NextResponse.json({ error: 'Programme not found' }, { status: 404 })
    }

    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('programme_id', programmeId)

    const visionId = programme.institutions?.national_visions?.id
    const { data: nationalSkills } = await supabase
      .from('skills')
      .select('*')
      .eq('vision_id', visionId)
      .eq('criticality', 'critical')

    const deepseek = createDeepSeekClient()

    const prompt = `You are an academic curriculum consultant working for a national ministry of education.

PROGRAMME: ${programme.name}
INSTITUTION: ${programme.institutions?.name}
NATIONAL VISION: ${programme.institutions?.national_visions?.vision_name}
CURRENT ALIGNMENT SCORE: ${programme.overall_alignment_score}/100

CURRENT COURSES:
${courses?.map(c => `- ${c.code}: ${c.name} (alignment: ${c.alignment_score}/100, last updated: ${c.last_updated})`).join('\n')}

CRITICAL NATIONAL SKILL NEEDS:
${nationalSkills?.slice(0, 8).map(s => `- ${s.name} (gap score: ${s.gap_score}/100, demand growth: ${s.annual_growth_rate}%/yr)`).join('\n')}

Return JSON:
{
  "overall_assessment": "brief paragraph",
  "current_score": number,
  "projected_score_after_changes": number,
  "course_scores": [
    { "course_code": string, "course_name": string, "current_score": number, "issue": string or null, "recommendation": string }
  ],
  "new_modules_recommended": [
    { "name": string, "rationale": string, "target_skills": [string], "estimated_demand_uplift": string, "replaces": string or null }
  ],
  "quick_wins": ["action1", "action2", "action3"],
  "implementation_priority": "high|medium|low",
  "employer_readiness_impact": "estimated percentage increase in graduate employability"
}`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    await supabase.from('ai_cache').upsert({
      cache_key: cacheKey,
      result,
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Curriculum analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyse curriculum' },
      { status: 500 }
    )
  }
}
