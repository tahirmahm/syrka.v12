import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const BANNED_WORDS = ['passionate', 'dynamic', 'results-driven', 'dedicated professional', 'leveraging', 'cutting-edge', 'synergy']

export async function POST(req: NextRequest) {
  try {
    const { skills, topCareer, background, country } = await req.json()

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ statement: 'Career Identity Statement generation requires AI configuration.' })
    }

    const countryContext = country === 'saudi'
      ? "Saudi Arabia's Vision 2030 economy"
      : "Malta's Vision 2050 digital economy"

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    const skillNames = (skills || []).slice(0, 6).map((s: { skill: string }) => s.skill).join(', ')

    for (let attempt = 0; attempt < 2; attempt++) {
      const completion = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: `Write a 3-sentence Career Identity Statement for a student targeting ${countryContext}.

Student background: ${background}
Top skills identified: ${skillNames}
Target career: ${topCareer?.title || 'Technology'} in ${topCareer?.sector || 'Technology'}

Rules:
- Sentence 1: Who they are and their core skill identity
- Sentence 2: Specific experience or achievement that demonstrates value
- Sentence 3: Where they are heading and why it aligns with the Vision

Write in first person. Be specific — reference actual skills and the target career. Do not use clichés like "passionate", "dynamic", "results-driven", "dedicated professional", "leveraging", "cutting-edge", or "synergy". Maximum 80 words total.`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      })

      const statement = completion.choices[0]?.message?.content?.trim() || ''

      const hasBanned = BANNED_WORDS.some((w) => statement.toLowerCase().includes(w))
      if (!hasBanned || attempt === 1) {
        return NextResponse.json({ statement })
      }
    }

    return NextResponse.json({ statement: 'Unable to generate statement.' })
  } catch (err) {
    console.error('identity-statement error:', err)
    return NextResponse.json({ statement: 'Unable to generate statement at this time.' })
  }
}
