import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const DIMENSION_WEIGHTS: Record<string, number> = {
  'Skill Match': 25,
  'Vision Alignment': 20,
  'Growth Trajectory': 15,
  'Compensation': 10,
  'Role Seniority Fit': 8,
  'Industry Demand': 7,
  'Location Fit': 5,
  'Company Reputation': 4,
  'Work-Life Balance': 3,
  'Learning Opportunity': 3,
}

function scoreToGrade(score: number): string {
  if (score >= 97) return 'A+'
  if (score >= 93) return 'A'
  if (score >= 90) return 'A-'
  if (score >= 87) return 'B+'
  if (score >= 83) return 'B'
  if (score >= 80) return 'B-'
  if (score >= 77) return 'C+'
  if (score >= 73) return 'C'
  if (score >= 70) return 'C-'
  if (score >= 67) return 'D+'
  if (score >= 63) return 'D'
  if (score >= 60) return 'D-'
  return 'F'
}

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
      salaryOffered,
      salaryCurrency,
      country,
      studentSkills,
    } = await req.json()

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    const dimensionList = Object.entries(DIMENSION_WEIGHTS)
      .map(([name, weight]) => `- ${name} (weight: ${weight}%)`)
      .join('\n')

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `You are an expert career advisor evaluating a job offer for a student in the context of ${VISION_LABELS[country] || VISION_LABELS.saudi}.

JOB OFFER:
- Title: ${jobTitle}
- Company: ${company}
- Description: ${description || 'Not provided'}
- Salary offered: ${salaryCurrency || 'USD'} ${salaryOffered || 'Not disclosed'}

STUDENT SKILLS: ${(studentSkills || []).join(', ')}
COUNTRY: ${country}

Evaluate this offer across these 10 dimensions, each scored 0-100:
${dimensionList}

For each dimension, provide:
1. A score (0-100)
2. A one-sentence rationale

Also provide:
- An overall weighted score (calculated from the dimension scores and weights above)
- A 2-3 sentence overall verdict
- Top 3 negotiation points the student should raise
- One key risk to watch for

Return valid JSON only:
{
  "dimensions": [
    { "name": "Skill Match", "score": 75, "weight": 25, "rationale": "..." }
  ],
  "overall_score": 72,
  "verdict": "...",
  "negotiation_points": ["...", "...", "..."],
  "key_risk": "..."
}`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.4,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    let evaluation: Record<string, unknown>
    try {
      evaluation = JSON.parse(content.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({ error: 'Failed to parse evaluation' }, { status: 500 })
    }

    const overallScore = typeof evaluation.overall_score === 'number'
      ? evaluation.overall_score
      : 0

    return NextResponse.json({
      ...evaluation,
      grade: scoreToGrade(overallScore),
      overall_score: overallScore,
    })
  } catch (err) {
    console.error('evaluate-offer error:', err)
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 })
  }
}
