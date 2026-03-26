import { NextRequest, NextResponse } from 'next/server'
import { createDeepSeekClient } from '@/lib/deepseek'

export async function POST(req: NextRequest) {
  try {
    const { sector, currentGap, intervention } = await req.json()

    const deepseek = createDeepSeekClient()

    const prompt = `You are a workforce planning economist. Model the impact of this policy intervention.

SECTOR: ${sector.name}
CURRENT GAP: ${currentGap.toLocaleString()} workers
VISION TARGET YEAR: ${sector.target_year}
CURRENT YEAR: ${new Date().getFullYear()}

PROPOSED INTERVENTION:
Type: ${intervention.type}
Annual output of trained workers: ${intervention.annual_output}
Start year: ${intervention.start_year}
Duration: ${intervention.duration_years} years
Estimated cost: $${intervention.cost_usd_millions}M

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
