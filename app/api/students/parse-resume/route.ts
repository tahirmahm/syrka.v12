import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const EMPTY_RESULT = {
  summary: '', explicit_skills: [], inferred_skills: [],
  inferred_interests: [], suggested_sectors: [], strongest_dimensions: [],
  education_field: '', career_stage: '', education_level: '', career_trajectory: '',
  vision_alignment_signals: [], name: null,
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const additionalContext = (formData.get('context') as string) || ''
    const country = (formData.get('country') as string) || 'saudi'

    if (!file) {
      return NextResponse.json({ profile: EMPTY_RESULT, error: 'No file provided' }, { status: 400 })
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ profile: EMPTY_RESULT, error: 'AI not configured' }, { status: 500 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name?.toLowerCase() || ''
    const isPDF = fileName.endsWith('.pdf') || file.type === 'application/pdf'
    const isDOCX = fileName.endsWith('.docx') || file.type?.includes('word')

    // Extract raw text
    let rawText = ''
    try {
      if (isPDF) {
        // Use internal path to avoid pdf-parse loading test file on init (breaks Vercel)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse/lib/pdf-parse.js')
        const pdfData = await pdfParse(buffer)
        rawText = pdfData.text || ''
      } else if (isDOCX) {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        rawText = result.value || ''
      }
    } catch (err) {
      console.error('File extraction error:', err)
      return NextResponse.json({ profile: EMPTY_RESULT, error: 'Could not read file' }, { status: 400 })
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json({ profile: EMPTY_RESULT, error: 'File appears empty or unreadable' }, { status: 400 })
    }

    // Truncate to stay within token limits
    const truncated = rawText.slice(0, 5000)

    const visionContext: Record<string, string> = {
      saudi: `Saudi Vision 2030 priority sectors and skills: artificial intelligence, machine learning, cloud computing, cybersecurity, fintech, renewable energy, smart cities, tourism technology, health informatics, digital media, logistics technology, defense technology, space technology. Target: diversify economy from oil, 70% private sector GDP, 1 million new jobs in priority sectors.`,
      malta: `Malta Vision 2050 priority sectors and skills: blockchain and Web3, AI and machine learning, iGaming technology, cybersecurity, fintech, maritime technology, climate technology, digital media, health technology. Target: transform into high-value knowledge economy with full digital employment.`,
      uk: `UK AI Opportunities Action Plan 2030 priority sectors and skills: AI and machine learning, cybersecurity, cloud and infrastructure, data science and analytics, digital foundations, health and public sector AI. Target: upskill 10 million workers in AI by 2030, £140B annual economic output. 97% of UK organisations report AI skills gaps.`,
    }

    const countryNames: Record<string, string> = { saudi: 'Saudi Arabia', malta: 'Malta', uk: 'United Kingdom' }
    const countryName = countryNames[country] || 'Saudi Arabia'

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `You are a career intelligence analyst specialising in ${countryName}'s ${country === 'saudi' ? 'Vision 2030' : 'Vision 2050'} human capital strategy.

Analyse this CV in full and extract a comprehensive profile. Go beyond what is explicitly stated — infer skills, aptitudes, and interests from the context of what the person has done.

${visionContext[country] || visionContext.saudi}

CV TEXT:
${truncated}

${additionalContext ? `Additional context from the student: ${additionalContext}` : ''}

Return valid JSON only, no preamble:
{
  "name": "first name only if found, otherwise null",
  "career_stage": "student | early_career | mid_career | career_changer",
  "education_level": "high_school | undergraduate | postgraduate | phd",
  "education_field": "main field of study",
  "explicit_skills": ["skills directly stated in CV"],
  "inferred_skills": ["skills we can reasonably infer from their experience and education even if not stated"],
  "inferred_interests": ["areas of genuine interest inferred from what they have chosen to do, study, or work on"],
  "strongest_dimensions": ["the 2-3 areas where this person is genuinely strongest based on the full CV"],
  "vision_alignment_signals": ["specific things in their CV that align with Vision priority sectors"],
  "summary": "3-4 sentence plain-language summary of this person's background and strengths, written as if briefing a career counsellor",
  "suggested_sectors": ["top 3 Vision-priority sectors this person is best suited for based on their profile"],
  "career_trajectory": "where this person appears to be heading based on their choices so far"
}`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.4,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    let profile: Record<string, unknown> = {}
    try {
      profile = JSON.parse(content.replace(/```json|```/g, '').trim())
    } catch {
      profile = { ...EMPTY_RESULT, summary: 'Could not parse profile — please describe your background manually.' }
    }

    // Ensure arrays exist
    for (const key of ['explicit_skills', 'inferred_skills', 'inferred_interests', 'strongest_dimensions', 'vision_alignment_signals', 'suggested_sectors']) {
      if (!Array.isArray(profile[key])) profile[key] = []
    }
    if (!profile.summary) profile.summary = ''

    profile.raw_text_length = rawText.length
    profile.country = country

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('parse-resume error:', err)
    return NextResponse.json({ profile: EMPTY_RESULT, error: 'Processing failed' }, { status: 500 })
  }
}
