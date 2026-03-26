import { NextRequest, NextResponse } from 'next/server'
import { createDeepSeekClient } from '@/lib/deepseek'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[scenario] Request body keys:', Object.keys(body))

    // Support both nested object format and flat field format
    const sectorName = body.sector?.name || body.sector_name
    const targetYear = body.sector?.target_year || body.target_year
    const currentWorkforce = body.sector?.current_workforce || body.current_workforce
    const targetWorkforce = body.sector?.target_workforce || body.target_workforce
    const currentGap = body.currentGap || (targetWorkforce - currentWorkforce)

    const interventionType = body.intervention?.type || body.intervention_type
    const annualOutput = body.intervention?.annual_output || body.annual_output
    const startYear = body.intervention?.start_year || body.start_year
    const durationYears = body.intervention?.duration_years || body.duration
    const costMillions = body.intervention?.cost_usd_millions || Math.round(annualOutput * durationYears * 0.015)

    console.log('[scenario] Parsed:', { sectorName, targetYear, currentGap, interventionType, annualOutput, startYear, durationYears })

    if (!sectorName || !targetYear) {
      return NextResponse.json(
        { error: `Missing required fields. Got: sectorName=${sectorName}, targetYear=${targetYear}` },
        { status: 400 }
      )
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY environment variable is not set' },
        { status: 500 }
      )
    }

    const deepseek = createDeepSeekClient()

    const prompt = `You are a workforce planning economist. Model the impact of this policy intervention.

SECTOR: ${sectorName}
CURRENT GAP: ${currentGap.toLocaleString()} workers
VISION TARGET YEAR: ${targetYear}
CURRENT YEAR: ${new Date().getFullYear()}

PROPOSED INTERVENTION:
Type: ${interventionType}
Annual output of trained workers: ${annualOutput}
Start year: ${startYear}
Duration: ${durationYears} years
Estimated cost: $${costMillions}M

Return JSON with these exact keys:
{
  "gap_closure_percent": number (0-100),
  "verdict": "green|amber|red",
  "minister_summary": "one sentence verdict for a minister",
  "cost_estimate": "formatted cost string e.g. $75M",
  "roi": "formatted ROI string e.g. 3.2x over 5 years",
  "trajectory": [
    { "year": number, "gap_remaining": number, "cumulative_workers_produced": number }
  ],
  "residual_gap_at_target": number,
  "risks": ["risk1", "risk2"]
}`

    console.log('[scenario] Calling DeepSeek...')

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    console.log('[scenario] DeepSeek responded')

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[scenario] Error:', message)
    return NextResponse.json(
      { error: `Scenario simulation failed: ${message}` },
      { status: 500 }
    )
  }
}
