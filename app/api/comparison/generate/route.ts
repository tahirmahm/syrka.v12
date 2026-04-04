import { NextRequest, NextResponse } from 'next/server'
import { createDeepSeekClient } from '@/lib/deepseek'
import { createClient } from '@/lib/supabase'

interface SimulationData {
  id: string
  prescription_id: string
  prescription: {
    title: string
    costEstimate: string
  }
  expectedValue: number
  confidenceLevel: string
  optimisticBound: number
  pessimisticBound: number
  supportScore: number
  topResistance: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      simulationA: SimulationData
      simulationB: SimulationData
      country: string
      sector: string
    }

    const { simulationA, simulationB, country, sector } = body

    const client = createDeepSeekClient()

    const prompt = `
You are a senior policy advisor with simulation data from two competing interventions
for closing ${country}'s ${sector} workforce gap.

Intervention A: ${simulationA.prescription.title}
Expected gap closure: ${simulationA.expectedValue}%
Confidence: ${simulationA.confidenceLevel}
Optimistic bound: ${simulationA.optimisticBound}%
Pessimistic bound: ${simulationA.pessimisticBound}%
Stakeholder support score: ${simulationA.supportScore}%
Key resistance: ${simulationA.topResistance}
Cost: ${simulationA.prescription.costEstimate}

Intervention B: ${simulationB.prescription.title}
Expected gap closure: ${simulationB.expectedValue}%
Confidence: ${simulationB.confidenceLevel}
Optimistic bound: ${simulationB.optimisticBound}%
Pessimistic bound: ${simulationB.pessimisticBound}%
Stakeholder support score: ${simulationB.supportScore}%
Key resistance: ${simulationB.topResistance}
Cost: ${simulationB.prescription.costEstimate}

Write exactly 3 paragraphs:
Paragraph 1: State which intervention you recommend and defend it with 2-3 specific pieces of evidence from the simulation data. Be direct. Start with "Syrka recommends [intervention name]."
Paragraph 2: State what the minister would need to believe for the other intervention to be better. Be specific about the assumption, not vague.
Paragraph 3: State one concrete action the minister can take in the next 30 days regardless of which path they choose. Be specific — name an institution, a ministry department, or a specific action.

Rules: Never use these phrases: it depends, both approaches, context matters, trade-offs exist, either option could work, it is important to note, there are merits to both.`

    let opinion = ''
    const maxRetries = 3
    const forbidden = [
      'both have merit',
      'it depends',
      'trade-offs exist',
      'context matters',
      'either option could work',
      'there are merits to both',
    ]

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
      })

      opinion = response.choices[0]?.message?.content ?? ''

      const hasForbidden = forbidden.some((phrase) =>
        opinion.toLowerCase().includes(phrase)
      )

      if (!hasForbidden && opinion.length > 50) break
    }

    // Persist to Supabase
    const supabase = createClient()
    await supabase.from('scenario_comparisons').insert({
      country,
      simulation_a_id: simulationA.id,
      simulation_b_id: simulationB.id,
      syrka_opinion: opinion,
      recommended_prescription_id: opinion.includes(simulationA.prescription.title)
        ? simulationA.prescription_id
        : simulationB.prescription_id,
    })

    return NextResponse.json({ opinion })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Comparison failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
