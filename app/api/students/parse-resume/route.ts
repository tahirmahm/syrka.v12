import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ extracted: { summary_for_career_planner: '' } })
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ extracted: { summary_for_career_planner: '' } })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'application/pdf'

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: 'text',
              text: `This is a CV or resume. Extract the following and return valid JSON only:
{
  "current_role": "current job title or study programme",
  "education": ["degree 1", "degree 2"],
  "experience": ["job/project 1", "job/project 2"],
  "skills_mentioned": ["skill 1", "skill 2"],
  "summary_for_career_planner": "2-3 sentences describing background in plain language suitable for career exploration"
}
No preamble. JSON only.`,
            },
          ],
        },
      ],
      max_tokens: 800,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    let extracted: Record<string, unknown> = {}
    try {
      extracted = JSON.parse(content.replace(/```json|```/g, '').trim())
    } catch {
      extracted = { summary_for_career_planner: '' }
    }

    // Ensure arrays exist
    if (!Array.isArray(extracted.education)) extracted.education = []
    if (!Array.isArray(extracted.experience)) extracted.experience = []
    if (!Array.isArray(extracted.skills_mentioned)) extracted.skills_mentioned = []

    return NextResponse.json({ extracted })
  } catch (err) {
    console.error('parse-resume error:', err)
    return NextResponse.json({ extracted: { summary_for_career_planner: '', education: [], experience: [], skills_mentioned: [] } })
  }
}
