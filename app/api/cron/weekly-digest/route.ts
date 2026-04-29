import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

function getSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getDeepSeek() {
  return new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY!,
  })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  const { data: cacheRows } = await supabase
    .from('research_feed_cache')
    .select('module_code, papers, field_velocity')

  if (!cacheRows || cacheRows.length === 0) {
    return NextResponse.json({ error: 'No research data — run research-update first' }, { status: 404 })
  }

  const allPapers: { title: string; module: string; citations: number; source: string }[] = []
  const velocitySummary: { module: string; velocity: number }[] = []

  for (const row of cacheRows) {
    velocitySummary.push({ module: row.module_code, velocity: row.field_velocity ?? 0 })
    const papers = (row.papers as { title: string; citation_count: number; source: string }[]) ?? []
    for (const p of papers.slice(0, 3)) {
      allPapers.push({
        title: p.title,
        module: row.module_code,
        citations: p.citation_count,
        source: p.source,
      })
    }
  }

  const topPapers = allPapers
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 10)

  const hottestFields = velocitySummary
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, 5)

  const prompt = `You are the editor of "This Week in AI", a weekly digest for computer science students studying AI.

Write a concise weekly digest (under 500 words) based on this data:

TOP PAPERS THIS WEEK:
${topPapers.map((p, i) => `${i + 1}. "${p.title}" (${p.module}, ${p.citations} citations, via ${p.source})`).join('\n')}

HOTTEST RESEARCH FIELDS (papers published in last 30 days):
${hottestFields.map(f => `- ${f.module}: ${f.velocity} papers/month`).join('\n')}

Structure: 1) A punchy 2-sentence intro, 2) "Top Papers" section with 1-line summaries of the 3 most important papers, 3) "Field Velocity" section noting which areas are accelerating, 4) "Student Action Items" with 2-3 specific things a CS+AI student should do this week.

Tone: Sharp, informed, slightly urgent. No fluff.`

  try {
    const deepseek = getDeepSeek()
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    })

    const digest = completion.choices[0]?.message?.content ?? ''
    const weekId = new Date().toISOString().slice(0, 10)

    await supabase
      .from('weekly_digests')
      .upsert({
        week_id: weekId,
        content: digest,
        paper_count: allPapers.length,
        top_velocity_module: hottestFields[0]?.module ?? null,
        created_at: new Date().toISOString(),
      }, { onConflict: 'week_id' })

    return NextResponse.json({
      week_id: weekId,
      digest,
      papers_analysed: allPapers.length,
      hottest_field: hottestFields[0]?.module,
    })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}
