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

  if (body.type === 'job' && user) {
    const { error } = await supabase
      .from('job_pipeline')
      .insert({
        user_id: user.id,
        job_title: body.data.title,
        company: body.data.company,
        job_url: body.data.sourceUrl,
        description: body.data.description,
        skills_required: body.data.skills || [],
        offer_score: body.data.score,
        offer_grade: body.data.grade,
        source: 'extension',
      })
    return Response.json({ success: !error, error: error?.message })
  }

  if (body.type === 'course' && user) {
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

  return Response.json({ success: true, authenticated: false })
}
