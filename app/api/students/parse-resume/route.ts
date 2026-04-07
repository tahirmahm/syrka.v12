import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const EMPTY_RESULT = { summary_for_career_planner: '', education: [], experience: [], skills_mentioned: [] }

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    return data.text || ''
  } catch {
    return ''
  }
}

function extractTextFromDOCX(buffer: Buffer): string {
  // DOCX is a zip containing XML. Extract raw text from word/document.xml
  try {
    const content = buffer.toString('utf-8')
    // Strip XML tags to get plain text — rough but works for extraction
    const textParts: string[] = []
    const tagRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g
    let match
    while ((match = tagRegex.exec(content)) !== null) {
      if (match[1]) textParts.push(match[1])
    }
    return textParts.join(' ')
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ extracted: EMPTY_RESULT })
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ extracted: EMPTY_RESULT })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name?.toLowerCase() || ''
    const isPDF = fileName.endsWith('.pdf') || file.type === 'application/pdf'
    const isDOCX = fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    // Extract text from the file
    let resumeText = ''
    if (isPDF) {
      resumeText = await extractTextFromPDF(buffer)
    } else if (isDOCX) {
      resumeText = extractTextFromDOCX(buffer)
    }

    if (!resumeText || resumeText.trim().length < 20) {
      return NextResponse.json({ extracted: EMPTY_RESULT })
    }

    // Truncate to avoid token limits
    const truncated = resumeText.slice(0, 4000)

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `This is the text extracted from a CV or resume. Extract the following and return valid JSON only:
{
  "current_role": "current job title or study programme",
  "education": ["degree 1", "degree 2"],
  "experience": ["job/project 1", "job/project 2"],
  "skills_mentioned": ["skill 1", "skill 2"],
  "summary_for_career_planner": "2-3 sentences describing background in plain language suitable for career exploration"
}
No preamble. JSON only.

Resume text:
${truncated}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    let extracted: Record<string, unknown> = {}
    try {
      extracted = JSON.parse(content.replace(/```json|```/g, '').trim())
    } catch {
      extracted = EMPTY_RESULT
    }

    // Ensure arrays exist
    if (!Array.isArray(extracted.education)) extracted.education = []
    if (!Array.isArray(extracted.experience)) extracted.experience = []
    if (!Array.isArray(extracted.skills_mentioned)) extracted.skills_mentioned = []
    if (!extracted.summary_for_career_planner) extracted.summary_for_career_planner = ''

    return NextResponse.json({ extracted })
  } catch (err) {
    console.error('parse-resume error:', err)
    return NextResponse.json({ extracted: EMPTY_RESULT })
  }
}
