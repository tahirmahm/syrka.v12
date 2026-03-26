import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createDeepSeekClient } from '@/lib/deepseek'

export async function POST(req: NextRequest) {
  try {
    const { visionSlug, sectorId } = await req.json()
    const cacheKey = `gap-analysis-${visionSlug}-${sectorId}`
    const supabase = createClient()

    const { data: cached } = await supabase
      .from('ai_cache')
      .select('result')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cached) return NextResponse.json(cached.result)

    const { data: sector } = await supabase
      .from('sectors')
      .select('*, national_visions(*)')
      .eq('id', sectorId)
      .single()

    if (!sector) {
      return NextResponse.json({ error: 'Sector not found' }, { status: 404 })
    }

    const { data: skills } = await supabase
      .from('skills')
      .select('*')
      .eq('sector_id', sectorId)
      .order('gap_score', { ascending: false })

    const deepseek = createDeepSeekClient()

    const prompt = `You are a senior labour economics analyst advising a government ministry on workforce policy.

CONTEXT:
Country: ${sector.national_visions.country}
National Vision: ${sector.national_visions.vision_name} (target year: ${sector.national_visions.target_year})
Sector: ${sector.name}
Current Workforce: ${sector.current_workforce.toLocaleString()}
Vision Target Workforce: ${sector.target_workforce.toLocaleString()}
Gap: ${(sector.target_workforce - sector.current_workforce).toLocaleString()} workers needed
Years to target: ${sector.target_year - new Date().getFullYear()}

CRITICAL SKILLS GAPS:
${skills?.slice(0, 6).map(s => `- ${s.name}: Current supply ${s.current_supply.toLocaleString()}, Projected demand ${s.projected_demand_target_year.toLocaleString()}, Gap score ${s.gap_score}/100`).join('\n')}

Provide a structured policy analysis in JSON format with these exact keys:
{
  "executive_summary": "2-3 sentence summary for a minister",
  "severity_rating": "critical|high|medium|low",
  "gap_percentage": number (percentage of target not yet met),
  "on_track": boolean,
  "projected_gap_at_target_year": number (workers still needed if current trajectory continues),
  "key_risks": ["risk1", "risk2", "risk3"],
  "intervention_options": [
    {
      "name": "intervention name",
      "type": "education_reform|bootcamp|immigration|reskilling|incentive",
      "description": "brief description",
      "estimated_annual_output": number,
      "implementation_years": number,
      "cost_estimate_usd_millions": number,
      "gap_closure_percentage": number,
      "confidence": "high|medium|low"
    }
  ],
  "recommended_intervention": "name of recommended option",
  "policy_note": "one paragraph suitable for a ministerial brief"
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
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Gap analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to generate gap analysis' },
      { status: 500 }
    )
  }
}
