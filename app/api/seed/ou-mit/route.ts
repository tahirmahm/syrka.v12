import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

function getDeepSeek() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: 'https://api.deepseek.com',
  })
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const OU_MODULES = [
  { code: 'TM111',  name: 'Introduction to computing and information technology 1',   credits: 30, stage: 1, mit_file: '6.100L.txt',     mit_number: '6.100L',     alignment_score: 82 },
  { code: 'TM112',  name: 'Introduction to computing and information technology 2',   credits: 30, stage: 1, mit_file: '6.0002.txt',     mit_number: '6.0002',     alignment_score: 78 },
  { code: 'MST124', name: 'Essential mathematics 1',                                  credits: 30, stage: 1, mit_file: '6.042J.txt',     mit_number: '6.042J',     alignment_score: 80 },
  { code: 'MU123',  name: 'Discovering mathematics',                                  credits: 30, stage: 1, mit_file: null,              mit_number: null,         alignment_score: 65 },
  { code: 'TM129',  name: 'Technologies in practice',                                 credits: 30, stage: 2, mit_file: '6.005.txt',      mit_number: '6.005',      alignment_score: 77 },
  { code: 'M249',   name: 'Practical modern statistics',                              credits: 30, stage: 2, mit_file: '18.650.txt',     mit_number: '18.650',     alignment_score: 91 },
  { code: 'M248',   name: 'Analysing data',                                           credits: 30, stage: 2, mit_file: '18.650.txt',     mit_number: '18.650',     alignment_score: 84 },
  { code: 'TM258',  name: 'Machine learning and artificial intelligence',              credits: 30, stage: 2, mit_file: '6.036.txt',      mit_number: '6.036',      alignment_score: 95 },
  { code: 'TM358',  name: 'Machine learning and artificial intelligence in practice',  credits: 30, stage: 3, mit_file: '6.034.txt',      mit_number: '6.034',      alignment_score: 88 },
  { code: 'TM351',  name: 'Data management and analysis',                             credits: 30, stage: 3, mit_file: '6.830.txt',      mit_number: '6.830',      alignment_score: 83 },
  { code: 'TM359',  name: 'Systems thinking: managing complexity',                    credits: 30, stage: 3, mit_file: 'RES-15-004.txt', mit_number: 'RES-15-004', alignment_score: 71 },
  { code: 'TM470',  name: 'The computing and IT project',                             credits: 30, stage: 3, mit_file: null,              mit_number: null,         alignment_score: 90 },
]

async function extractSkillsFromSyllabus(
  mitNumber: string,
  syllabusText: string,
  ouCode: string,
  ouName: string
): Promise<{ skills_taught: string[]; lecture_topics: string[]; description: string }> {
  const response = await getDeepSeek().chat.completions.create({
    model: 'deepseek-chat',
    messages: [{
      role: 'user',
      content: `Extract structured data from this MIT OpenCourseWare syllabus.

MIT Course: ${mitNumber}
OU Module Equivalent: ${ouCode} — ${ouName}

Syllabus:
${syllabusText.slice(0, 6000)}

Return JSON only — no markdown, no preamble:
{
  "skills_taught": ["skill1", "skill2", ...],
  "lecture_topics": ["topic1", "topic2", ...],
  "description": "one paragraph description of what this course teaches"
}

For skills_taught: be specific and technical. Aim for 15-20 skills minimum.
Examples of good skills: "gradient descent optimisation", "B+ tree indexing",
"causal loop diagram construction", "backpropagation", "SQL query optimisation".
Not: "machine learning" (too vague) — instead: "logistic regression", "k-means clustering".`,
    }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  })
  return JSON.parse(response.choices[0].message.content || '{}')
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown>[] = []
  const supabase = getSupabase()

  try {
    // 1. Get or create The Open University institution
    const { data: visionRow } = await supabase
      .from('national_visions')
      .select('id')
      .eq('slug', 'uk')
      .maybeSingle()

    const visionId = visionRow?.id

    const { data: existingInst } = await supabase
      .from('institutions')
      .select('id')
      .eq('name', 'The Open University')
      .maybeSingle()

    let institutionId: string

    if (existingInst?.id) {
      institutionId = existingInst.id as string
      results.push({ step: 'institution', status: 'already_exists', id: institutionId })
    } else {
      const { data: newInst, error: instErr } = await supabase
        .from('institutions')
        .insert({
          vision_id: visionId,
          name: 'The Open University',
          type: 'university',
          student_count: 170000,
          annual_graduate_count: 14000,
          location: 'Milton Keynes, United Kingdom',
          established_year: 1969,
          national_ranking: 1,
        })
        .select('id')
        .single()

      if (instErr || !newInst) throw new Error(`Institution insert failed: ${instErr?.message}`)
      institutionId = newInst.id as string
      results.push({ step: 'institution', status: 'created', id: institutionId })
    }

    // 2. Get or create OU R88 programme
    const { data: existingProg } = await supabase
      .from('programmes')
      .select('id')
      .eq('name', 'BSc (Honours) Computer Science with Artificial Intelligence')
      .maybeSingle()

    let programmeId: string

    if (existingProg?.id) {
      programmeId = existingProg.id as string
      results.push({ step: 'programme', status: 'already_exists', id: programmeId })
    } else {
      const { data: newProg, error: progErr } = await supabase
        .from('programmes')
        .insert({
          institution_id: institutionId,
          name: 'BSc (Honours) Computer Science with Artificial Intelligence',
          level: 'bachelor',
          duration_years: 3.0,
          annual_intake: 2400,
          annual_graduates: 1800,
          overall_alignment_score: 76.0,
          employment_rate_6months: 84.0,
          avg_starting_salary: 38000,
        })
        .select('id')
        .single()

      if (progErr || !newProg) throw new Error(`Programme insert failed: ${progErr?.message}`)
      programmeId = newProg.id as string
      results.push({ step: 'programme', status: 'created', id: programmeId })
    }

    // 3. Process each module
    for (const mod of OU_MODULES) {
      const moduleResult: Record<string, unknown> = { code: mod.code, mit: mod.mit_number }

      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('code', mod.code)
        .eq('programme_id', programmeId)
        .maybeSingle()

      if (existingCourse?.id) {
        moduleResult.status = 'already_exists'
        moduleResult.course_id = existingCourse.id
        results.push(moduleResult)
        continue
      }

      let extracted: { skills_taught: string[]; lecture_topics: string[]; description: string } | null = null

      if (mod.mit_file) {
        const cacheKey = `mit-syllabus-${mod.mit_number}-${mod.code}`

        const { data: cached } = await supabase
          .from('ai_cache')
          .select('result')
          .eq('cache_key', cacheKey)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle()

        if (cached?.result) {
          extracted = cached.result as typeof extracted
          moduleResult.cache = 'hit'
        } else {
          const filePath = path.join(process.cwd(), 'mit-syllabi', mod.mit_file)
          const syllabusText = fs.existsSync(filePath)
            ? fs.readFileSync(filePath, 'utf-8')
            : `${mod.mit_number} ${mod.name}: core computing and AI topics`

          moduleResult.file_found = fs.existsSync(filePath)

          extracted = await extractSkillsFromSyllabus(
            mod.mit_number ?? '',
            syllabusText,
            mod.code,
            mod.name
          )

          await supabase.from('ai_cache').upsert({
            cache_key: cacheKey,
            result: extracted,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })

          moduleResult.cache = 'miss'
          moduleResult.skills_extracted = extracted?.skills_taught?.length ?? 0
        }
      }

      const description = extracted?.description
        ?? (mod.mit_number
          ? `MIT ${mod.mit_number} equivalent. ${mod.name}.`
          : `OU R88 Stage ${mod.stage} module. ${mod.name}.`)

      const { data: course, error: courseErr } = await supabase
        .from('courses')
        .insert({
          programme_id: programmeId,
          name: mod.name,
          code: mod.code,
          credits: mod.credits,
          year_of_study: mod.stage,
          alignment_score: mod.alignment_score,
          last_updated: 2024,
          description,
        })
        .select('id')
        .single()

      if (courseErr || !course) {
        moduleResult.status = 'error'
        moduleResult.error = courseErr?.message
        results.push(moduleResult)
        continue
      }

      moduleResult.course_id = course.id

      let skillsLinked = 0

      if (extracted?.skills_taught?.length) {
        for (const skillName of extracted.skills_taught.slice(0, 20)) {
          let { data: skill } = await supabase
            .from('skills')
            .select('id')
            .ilike('name', skillName)
            .maybeSingle()

          if (!skill) {
            const { data: newSkill } = await supabase
              .from('skills')
              .insert({
                vision_id: visionId,
                sector_id: null,
                name: skillName,
                category: mod.stage === 1 ? 'Foundation' : mod.stage === 2 ? 'Applied' : 'Advanced',
                current_supply: 1000,
                projected_demand_target_year: 5000,
                annual_growth_rate: 15.0,
                gap_score: 65.0,
                criticality: mod.stage === 3 ? 'critical' : mod.stage === 2 ? 'high' : 'medium',
              })
              .select('id')
              .maybeSingle()
            skill = newSkill
          }

          if (skill?.id) {
            const coverage = mod.stage === 1
              ? 'introduced'
              : mod.stage === 2 ? 'developed' : 'mastered'

            await supabase
              .from('course_skills')
              .upsert(
                { course_id: course.id as string, skill_id: skill.id as string, coverage_level: coverage },
                { onConflict: 'course_id,skill_id' }
              )
            skillsLinked++
          }
        }
      }

      moduleResult.status = 'created'
      moduleResult.skills_linked = skillsLinked
      results.push(moduleResult)
    }

    return NextResponse.json({
      success: true,
      institution_id: institutionId,
      programme_id: programmeId,
      modules_processed: OU_MODULES.length,
      results,
    })

  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      partial_results: results,
    }, { status: 500 })
  }
}
