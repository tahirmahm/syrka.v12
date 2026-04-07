import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const { step1, step2, interests, country, resumeSkills } = await req.json()

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ skills: [] }, { status: 200 })
    }

    const visionContext: Record<string, string> = {
      saudi: 'Saudi Vision 2030: artificial intelligence, cloud computing, cybersecurity, fintech, renewable energy, smart cities, tourism technology',
      malta: 'Malta Vision 2050: blockchain, AI, iGaming technology, cybersecurity, fintech, maritime technology, climate technology',
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
          content: `You are a career counsellor helping a student in ${country === 'saudi' ? 'Saudi Arabia' : 'Malta'} understand their transferable skills in the context of ${visionContext[country] || visionContext.saudi}.

Student background: ${step1}
Student experiences: ${step2}
Student interests: ${(interests || []).join(', ')}${resumeSkills && resumeSkills.length > 0 ? `\nSkills explicitly mentioned in their CV: ${resumeSkills.join(', ')}` : ''}

Extract exactly 12 specific, concrete transferable skills this person likely has based on what they have shared. Map each to the nearest ESCO Skills Taxonomy label.

Return valid JSON array only, no preamble:
[
  {
    "skill": "Data analysis",
    "esco_label": "Analyse data",
    "source": "From your Python project experience",
    "vision_relevance": "high"
  }
]`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content || '[]'
    let skills = []
    try {
      skills = JSON.parse(content.replace(/```json|```/g, '').trim())
    } catch {
      skills = []
    }

    return NextResponse.json({ skills })
  } catch (err) {
    console.error('extract-skills error:', err)
    return NextResponse.json({ skills: [] })
  }
}
