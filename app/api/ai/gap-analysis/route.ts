import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createDeepSeekClient } from '@/lib/deepseek'

export async function POST(req: NextRequest) {
  let debugInfo = ''
  try {
    const body = await req.json()
    const visionSlug = body.visionSlug || body.vision_slug
    const sectorId = body.sectorId || body.sector_id

    debugInfo = `visionSlug=${visionSlug}, sectorId=${sectorId}`
    console.log('[gap-analysis] Request:', debugInfo)

    if (!sectorId) {
      return NextResponse.json(
        { error: 'Missing sectorId in request body', debug: debugInfo },
        { status: 400 }
      )
    }

    const cacheKey = `gap-analysis-${visionSlug}-${sectorId}`
    const supabase = createClient()

    // Check cache
    const { data: cached } = await supabase
      .from('ai_cache')
      .select('result')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cached) {
      console.log('[gap-analysis] Cache hit')
      return NextResponse.json(cached.result)
    }

    // Fetch sector with vision
    const { data: sector, error: sectorError } = await supabase
      .from('sectors')
      .select('*, national_visions(*)')
      .eq('id', sectorId)
      .single()

    if (sectorError) {
      console.error('[gap-analysis] Supabase sector error:', sectorError)
      return NextResponse.json(
        { error: `Sector query failed: ${sectorError.message}`, debug: debugInfo },
        { status: 500 }
      )
    }

    if (!sector) {
      return NextResponse.json(
        { error: 'Sector not found', debug: debugInfo },
        { status: 404 }
      )
    }

    console.log('[gap-analysis] Found sector:', sector.name)

    // Fetch skills
    const { data: skills } = await supabase
      .from('skills')
      .select('*')
      .eq('sector_id', sectorId)
      .order('gap_score', { ascending: false })

    console.log('[gap-analysis] Found skills:', skills?.length || 0)

    // Check DeepSeek API key
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY environment variable is not set' },
        { status: 500 }
      )
    }

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
  "severity": "critical|high|moderate|low",
  "gap_percentage": number,
  "on_track": boolean,
  "projected_gap_at_target_year": number,
  "key_risks": ["risk1", "risk2", "risk3"],
  "intervention_options": [
    {
      "name": "intervention name",
      "impact": "brief impact description",
      "timeframe": "e.g. 3-5 years",
      "cost": "e.g. $50M-100M",
      "feasibility": "high|medium|low"
    }
  ],
  "policy_note": "one paragraph suitable for a ministerial brief"
}`

    console.log('[gap-analysis] Calling DeepSeek...')

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    console.log('[gap-analysis] DeepSeek responded')

    const result = JSON.parse(response.choices[0].message.content || '{}')

    // Cache for 24 hours
    await supabase.from('ai_cache').upsert({
      cache_key: cacheKey,
      result,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[gap-analysis] Error:', message, debugInfo)
    return NextResponse.json(
      { error: `Gap analysis failed: ${message}` },
      { status: 500 }
    )
  }
}
