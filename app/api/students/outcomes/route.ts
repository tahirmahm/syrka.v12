import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId, jobPipelineId, jobTitle, company, status,
      rejectionStage, rejectionReason, skillsTheyAskedAbout,
      skillsILacked, interviewNotes, feedbackFromEmployer,
    } = body

    if (!jobTitle || !company || !status) {
      return NextResponse.json({ error: 'jobTitle, company, and status are required' }, { status: 400 })
    }

    const supabase = createClient()

    const outcomeRow: Record<string, unknown> = {
      job_title: jobTitle,
      company,
      status,
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (userId) outcomeRow.user_id = userId
    if (jobPipelineId) outcomeRow.job_pipeline_id = jobPipelineId
    if (rejectionStage) outcomeRow.rejection_stage = rejectionStage
    if (rejectionReason) outcomeRow.rejection_reason = rejectionReason
    if (skillsTheyAskedAbout) outcomeRow.skills_they_asked_about = skillsTheyAskedAbout
    if (skillsILacked) outcomeRow.skills_i_lacked = skillsILacked
    if (interviewNotes) outcomeRow.interview_notes = interviewNotes
    if (feedbackFromEmployer) outcomeRow.feedback_from_employer = feedbackFromEmployer

    // Generate learning signal via DeepSeek
    let learningSignal: Record<string, unknown> = {}
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const client = new OpenAI({
          baseURL: 'https://api.deepseek.com/v1',
          apiKey: process.env.DEEPSEEK_API_KEY,
        })
        const completion = await client.chat.completions.create({
          model: 'deepseek-chat',
          messages: [{
            role: 'user',
            content: `A student applied for ${jobTitle} at ${company} and got ${status}.
Stage reached: ${rejectionStage || 'unknown'}.
Skills the employer asked about: ${(skillsTheyAskedAbout || []).join(', ') || 'unknown'}.
Skills the student lacked: ${(skillsILacked || []).join(', ') || 'unknown'}.
Employer feedback if any: ${feedbackFromEmployer || 'none'}.

Generate a precise learning signal as JSON:
{
  "priority_skill_to_learn": "string",
  "why": "string",
  "specific_resource": "string",
  "estimated_days_to_competency": number,
  "how_this_changes_their_trajectory": "string",
  "adjusted_target_roles": ["string"],
  "confidence_boost_action": "string"
}
Return ONLY the JSON.`,
          }],
          max_tokens: 800,
          temperature: 0.4,
        })
        const content = completion.choices[0]?.message?.content || '{}'
        learningSignal = JSON.parse(content.replace(/```json|```/g, '').trim())
      } catch {}
    }

    outcomeRow.learning_signal = learningSignal

    const { data, error } = await supabase
      .from('application_outcomes')
      .insert(outcomeRow)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ outcome: data, learningSignal })
  } catch (err) {
    console.error('outcomes POST error:', err)
    return NextResponse.json({ error: 'Failed to log outcome' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ outcomes: [], stats: null })
    }

    const supabase = createClient()

    const { data: outcomes } = await supabase
      .from('application_outcomes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const all = outcomes || []
    const total = all.length
    const withResponse = all.filter(o => o.status !== 'applied' && o.status !== 'ghosted').length
    const interviews = all.filter(o => ['interview', 'offer'].includes(o.status)).length

    const missingSkillsMap: Record<string, number> = {}
    const askedSkillsMap: Record<string, number> = {}

    for (const o of all) {
      for (const s of (o.skills_i_lacked as string[]) || []) {
        missingSkillsMap[s] = (missingSkillsMap[s] || 0) + 1
      }
      for (const s of (o.skills_they_asked_about as string[]) || []) {
        askedSkillsMap[s] = (askedSkillsMap[s] || 0) + 1
      }
    }

    const topMissingSkills = Object.entries(missingSkillsMap)
      .sort(([, a], [, b]) => b - a).slice(0, 5).map(([s]) => s)
    const topAskedSkills = Object.entries(askedSkillsMap)
      .sort(([, a], [, b]) => b - a).slice(0, 5).map(([s]) => s)

    const STAGE_ORDER = ['applied', 'viewed', 'phone_screen', 'interview', 'offer']
    const stageScores = all.map(o => {
      const idx = STAGE_ORDER.indexOf(o.status)
      return idx >= 0 ? idx : 0
    })
    const avgStageIdx = stageScores.length > 0
      ? Math.round(stageScores.reduce((a, b) => a + b, 0) / stageScores.length)
      : 0
    const avgStageReached = STAGE_ORDER[avgStageIdx] || 'applied'

    const offers = all.filter(o => o.status === 'offer').length
    const successPattern = offers > 0
      ? `${offers} offer(s) received — analyse what worked in those applications.`
      : total > 5
        ? `${total} applications sent. Focus on the stage where you get stuck most.`
        : 'Keep applying and logging outcomes to build your pattern.'

    return NextResponse.json({
      outcomes: all,
      stats: {
        total,
        responseRate: total > 0 ? Math.round((withResponse / total) * 100) : 0,
        interviewRate: total > 0 ? Math.round((interviews / total) * 100) : 0,
        topMissingSkills,
        topAskedSkills,
        avgStageReached,
        successPattern,
      },
    })
  } catch (err) {
    console.error('outcomes GET error:', err)
    return NextResponse.json({ outcomes: [], stats: null })
  }
}
