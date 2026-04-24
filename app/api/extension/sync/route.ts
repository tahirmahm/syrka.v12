import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const body = await request.json()

  if (!user) {
    return Response.json({ success: true, authenticated: false })
  }

  if (body.type === 'job') {
    const { data: job } = await supabase
      .from('job_pipeline')
      .insert({
        user_id: user.id,
        job_title: body.data.title,
        company: body.data.company,
        job_url: body.data.sourceUrl,
        description: (body.data.description || '').substring(0, 2000),
        skills_required: body.data.skills || [],
        offer_score: body.data.score,
        offer_grade: body.data.grade,
        source: 'extension',
      })
      .select()
      .single()

    const { data: patterns } = await supabase
      .from('application_outcomes')
      .select('skills_i_lacked, rejection_stage')
      .eq('user_id', user.id)
      .eq('status', 'rejected')
      .limit(20)

    const rejectionSkillCounts: Record<string, number> = {}
    for (const p of patterns || []) {
      for (const s of (p.skills_i_lacked as string[]) || []) {
        rejectionSkillCounts[s] = (rejectionSkillCounts[s] || 0) + 1
      }
    }
    const topRejectionSkills = Object.entries(rejectionSkillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([skill]) => skill)

    return Response.json({
      success: true,
      jobId: job?.id,
      rejectionPatternWarning: topRejectionSkills.length > 0 ? {
        message: 'Based on your past applications, watch out for these gaps',
        skills: topRejectionSkills,
      } : null,
    })
  }

  if (body.type === 'course') {
    const { error } = await supabase
      .from('moodle_courses')
      .upsert({
        user_id: user.id,
        course_name: body.data.courseName,
        modules: body.data.modules || [],
        extracted_skills: body.data.extractedSkills || [],
        vision_alignment: body.data.visionAlignment || [],
        skill_gaps: body.data.skillGaps || [],
        course_url: body.data.sourceUrl,
        synced_at: new Date().toISOString(),
      })
    return Response.json({ success: !error, error: error?.message })
  }

  return Response.json({ success: false, error: 'Unknown type' })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}
