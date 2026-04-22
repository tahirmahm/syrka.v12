import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const VISION_LABELS: Record<string, string> = {
  saudi: "Saudi Arabia's Vision 2030",
  malta: "Malta's Vision 2050",
  uk: "the UK AI Opportunities Action Plan 2030",
}

export async function POST(req: NextRequest) {
  try {
    const {
      jobTitle,
      company,
      description,
      studentSkills,
      studentSummary,
      country,
    } = await req.json()

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
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
          content: `You are a CV and cover letter specialist helping a student tailor their application for a specific role in the context of ${VISION_LABELS[country] || VISION_LABELS.saudi}.

TARGET ROLE:
- Title: ${jobTitle}
- Company: ${company}
- Description: ${description || 'Not provided'}

STUDENT PROFILE:
- Summary: ${studentSummary || 'Not provided'}
- Skills: ${(studentSkills || []).join(', ')}
- Country: ${country}

Generate a structured CV brief with:

1. **Headline**: A punchy one-line professional headline for the CV (under 15 words)
2. **Skills to highlight**: Top 6 skills from the student's profile that best match this role, in priority order
3. **Skills to downplay**: Any skills that are irrelevant or might dilute the application
4. **Cover letter opening**: A compelling 2-sentence opening paragraph for a cover letter
5. **ATS keywords**: 8-12 keywords to weave into the CV for applicant tracking systems
6. **Accomplishment reframes**: 3 bullet points showing how to reframe existing experience to match this role (use the "Accomplished [X] by doing [Y] which resulted in [Z]" format)
7. **Vision alignment statement**: One sentence connecting the student's career to ${VISION_LABELS[country] || 'the national vision'}

Return valid JSON only:
{
  "headline": "...",
  "skills_to_highlight": ["...", "..."],
  "skills_to_downplay": ["...", "..."],
  "cover_letter_opening": "...",
  "ats_keywords": ["...", "..."],
  "accomplishment_reframes": ["...", "...", "..."],
  "vision_alignment_statement": "..."
}`,
        },
      ],
      max_tokens: 1200,
      temperature: 0.5,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    let brief: Record<string, unknown>
    try {
      brief = JSON.parse(content.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({ error: 'Failed to parse brief' }, { status: 500 })
    }

    return NextResponse.json(brief)
  } catch (err) {
    console.error('generate-cv-brief error:', err)
    return NextResponse.json({ error: 'Brief generation failed' }, { status: 500 })
  }
}
