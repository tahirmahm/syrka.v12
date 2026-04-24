import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const { submissionText, assignmentBrief, studentSkills, country } = await req.json()

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    if (!submissionText) {
      return NextResponse.json({ error: 'Submission text is required' }, { status: 400 })
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
          content: `You are an AI-native assessment engine. Evaluate this student submission for sophisticated AI collaboration skills, NOT for AI detection. The goal is to measure HOW well they used AI as a thinking partner, not whether they used it.

ASSIGNMENT BRIEF: ${assignmentBrief || 'Not provided'}

STUDENT SUBMISSION:
${submissionText.substring(0, 3000)}

STUDENT SKILLS: ${(studentSkills || []).join(', ')}
COUNTRY: ${country || 'saudi'}

Score on these 5 dimensions (0-10 each):

1. Prompt Architecture — did they clearly frame problems for AI?
2. Critical Interrogation — did they question and verify AI outputs?
3. Synthesis Quality — did they integrate AI output with original thinking?
4. Epistemic Transparency — did they acknowledge AI's role clearly?
5. Orchestration Sophistication — did they use AI as a thinking partner not just a text generator?

Return ONLY JSON:
{
  "dimensions": {
    "Prompt Architecture": { "score": 7, "evidence": "...", "feedback": "..." },
    "Critical Interrogation": { "score": 6, "evidence": "...", "feedback": "..." },
    "Synthesis Quality": { "score": 8, "evidence": "...", "feedback": "..." },
    "Epistemic Transparency": { "score": 5, "evidence": "...", "feedback": "..." },
    "Orchestration Sophistication": { "score": 7, "evidence": "...", "feedback": "..." }
  },
  "overall_ai_literacy_score": 66,
  "grade": "B",
  "headline": "...",
  "what_they_did_well": ["...", "..."],
  "what_to_develop": ["...", "..."],
  "vs_human_alone": "..."
}`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.4,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    let assessment: Record<string, unknown>
    try {
      assessment = JSON.parse(content.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({ error: 'Failed to parse assessment' }, { status: 500 })
    }

    return NextResponse.json(assessment)
  } catch (err) {
    console.error('assess-ai-usage error:', err)
    return NextResponse.json({ error: 'Assessment failed' }, { status: 500 })
  }
}
