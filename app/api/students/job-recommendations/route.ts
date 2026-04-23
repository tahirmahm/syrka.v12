import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase'

const COUNTRY_LABELS: Record<string, string> = {
  saudi: 'Saudi Arabia',
  malta: 'Malta',
  uk: 'United Kingdom',
}

export async function POST(req: NextRequest) {
  try {
    const { skills, country, userId } = await req.json()

    let resolvedSkills = skills as string[]

    if ((!resolvedSkills || resolvedSkills.length === 0) && userId) {
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('extracted_skills')
        .eq('id', userId)
        .single()
      if (profile?.extracted_skills) {
        resolvedSkills = profile.extracted_skills as string[]
      }
    }

    if (!resolvedSkills || resolvedSkills.length === 0) {
      return NextResponse.json([])
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json([])
    }

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    const countryLabel = COUNTRY_LABELS[country] || 'Saudi Arabia'

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `You are a career intelligence engine. Given a student's extracted skills, recommend 6 real job roles they are genuinely suited for RIGHT NOW, completely sector-agnostic — recommend based purely on skill match, not national vision alignment.

Student skills: ${resolvedSkills.join(', ')}
Country: ${countryLabel}

For each job return:
{
  "title": "string",
  "description": "string (2 sentences)",
  "matchPercent": number,
  "keySkillsMatched": ["string"],
  "salaryRange": "string (realistic for ${countryLabel})",
  "seniorityLevel": "Junior" | "Mid" | "Senior",
  "searchQuery": "string (exact query to search on LinkedIn Jobs)",
  "linkedinSearchUrl": "string (full URL: https://www.linkedin.com/jobs/search/?keywords=ENCODED_QUERY&location=${encodeURIComponent(countryLabel)})",
  "indeedSearchUrl": "string (https://www.indeed.com/jobs?q=ENCODED_QUERY)",
  "whyMatch": "string (one sentence personalised to their skills)"
}

Return ONLY a JSON array of 6 objects. No markdown, no preamble.`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.5,
    })

    const content = completion.choices[0]?.message?.content || '[]'
    let recommendations: unknown[]
    try {
      recommendations = JSON.parse(content.replace(/```json|```/g, '').trim())
    } catch {
      recommendations = []
    }

    return NextResponse.json(recommendations)
  } catch (err) {
    console.error('job-recommendations error:', err)
    return NextResponse.json([])
  }
}
