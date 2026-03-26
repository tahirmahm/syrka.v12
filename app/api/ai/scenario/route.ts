import { NextRequest, NextResponse } from 'next/server'
import { createDeepSeekClient } from '@/lib/deepseek'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Support both nested object format and flat field format from the simulator component
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

Return JSON with:
{
  "trajectory": [
    { "year": 2025, "gap_remaining": number, "cumulative_workers_produced": number },
    ... through target year
  ],
  "gap_closure_percentage": number,
  "break_even_year": number or null,
  "roi_5year": number,
  "residual_gap_at_target": number,
  "risks": ["risk1", "risk2"],
  "verdict": "closes_gap|partially_closes|insufficient",
  "minister_summary": "one sentence verdict"
}`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    return NextResponse.json(JSON.parse(response.choices[0].message.content || '{}'))
  } catch (error) {
    console.error('Scenario error:', error)
    return NextResponse.json(
      { error: 'Failed to run scenario simulation' },
      { status: 500 }
    )
  }
}
