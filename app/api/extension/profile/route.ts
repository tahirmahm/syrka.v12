import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
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
  if (!user) return NextResponse.json({ authenticated: false })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('extracted_skills, orchestration_score, career_identity_statement, country')
    .eq('id', user.id)
    .single()

  const { data: outcomes } = await supabase
    .from('application_outcomes')
    .select('status, skills_i_lacked, skills_they_asked_about, company, job_title')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: signal } = await supabase
    .from('learning_signals')
    .select('recommended_focus, week_start')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  const topMissingSkills: Record<string, number> = {}
  for (const o of outcomes || []) {
    for (const skill of (o.skills_i_lacked as string[]) || []) {
      topMissingSkills[skill] = (topMissingSkills[skill] || 0) + 1
    }
  }

  const weeklySignal = signal?.recommended_focus as Record<string, string> | null

  return NextResponse.json({
    authenticated: true,
    skills: profile?.extracted_skills || [],
    orchestrationScore: profile?.orchestration_score || 0,
    careerStatement: profile?.career_identity_statement,
    country: profile?.country || 'saudi',
    weeklySignal: weeklySignal ? {
      week_focus: weeklySignal.weekFocus,
      skill_to_drop_everything_for: weeklySignal.skillToDropEverythingFor,
      top_three_actions: weeklySignal.topThreeActions,
    } : null,
    recentOutcomes: (outcomes || []).slice(0, 5),
    topMissingSkills: Object.entries(topMissingSkills)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([skill]) => skill),
  })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}
