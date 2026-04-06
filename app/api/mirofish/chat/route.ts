import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, simulation, system_prompt } = body

    // If MiroFish is available, proxy to it
    if (process.env.MIROFISH_URL) {
      const res = await fetch(`${process.env.MIROFISH_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      return NextResponse.json(data)
    }

    // Fallback: use DeepSeek for stakeholder chat
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { response: 'Stakeholder chat requires an AI provider. Please configure DEEPSEEK_API_KEY.' },
        { status: 200 }
      )
    }

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    const simulationContext = simulation
      ? `Simulation context: "${simulation.prescription_title}" in ${simulation.country}. ` +
        `Expected value: ${simulation.expected_value ?? 'N/A'}. ` +
        `Confidence: ${simulation.confidence_level ?? 'N/A'}. ` +
        `Supporters: ${(simulation.supporters ?? []).map((s: { name: string }) => s.name).join(', ') || 'N/A'}. ` +
        `Resistance: ${(simulation.resistance_groups ?? []).map((r: { name: string }) => r.name).join(', ') || 'N/A'}. ` +
        `Critical success factors: ${(simulation.critical_success_factors ?? []).join('; ') || 'N/A'}. ` +
        `Failure modes: ${(simulation.failure_modes ?? []).join('; ') || 'N/A'}.`
      : ''

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: system_prompt || 'You are a stakeholder in a policy simulation. Respond in character based on the simulation context. Be specific and concise (2-3 sentences).',
        },
        {
          role: 'system',
          content: simulationContext,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content ?? 'No response generated.'

    return NextResponse.json({ response })
  } catch (err: unknown) {
    return NextResponse.json(
      { response: `Chat request failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 200 }
    )
  }
}
