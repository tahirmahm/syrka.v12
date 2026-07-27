import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getAllTrackableModules } from '@/lib/research'
import type { ResearchPaper } from '@/lib/research'

function getSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
}

async function fetchArxiv(moduleCode: string): Promise<ResearchPaper[]> {
  try {
    const base = getBaseUrl()
    const res = await fetch(`${base}/api/research/arxiv?module=${moduleCode}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.papers ?? []
  } catch {
    return []
  }
}

async function fetchSemanticScholar(moduleCode: string): Promise<ResearchPaper[]> {
  try {
    const base = getBaseUrl()
    const res = await fetch(`${base}/api/research/semantic-scholar?module=${moduleCode}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.papers ?? []
  } catch {
    return []
  }
}

async function fetchOpenAlex(moduleCode: string): Promise<ResearchPaper[]> {
  try {
    const base = getBaseUrl()
    const res = await fetch(`${base}/api/research/openalex?module=${moduleCode}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.papers ?? []
  } catch {
    return []
  }
}

function deduplicatePapers(papers: ResearchPaper[]): ResearchPaper[] {
  const seen = new Map<string, ResearchPaper>()

  for (const paper of papers) {
    const key = paper.doi ?? paper.arxiv_id ?? paper.title.toLowerCase().slice(0, 80)
    const existing = seen.get(key)
    if (!existing || paper.citation_count > existing.citation_count) {
      seen.set(key, paper)
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => b.citation_count - a.citation_count)
}

function computeFieldVelocity(papers: ResearchPaper[]): number {
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  const recentCount = papers.filter(p => {
    const d = new Date(p.published_date).getTime()
    return d > thirtyDaysAgo
  }).length
  return recentCount
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const modules = getAllTrackableModules()
  const supabase = getSupabase()
  const results: { module: string; papers: number; velocity: number }[] = []

  for (const mod of modules) {
    const [arxiv, s2, oa] = await Promise.all([
      fetchArxiv(mod.code),
      fetchSemanticScholar(mod.code),
      fetchOpenAlex(mod.code),
    ])

    const allPapers = [...arxiv, ...s2, ...oa]
    const deduplicated = deduplicatePapers(allPapers)
    const topPapers = deduplicated.slice(0, 10)
    const velocity = computeFieldVelocity(allPapers)

    const now = new Date()
    const nextUpdate = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    await supabase
      .from('research_feed_cache')
      .upsert({
        module_code: mod.code,
        papers: topPapers,
        field_velocity: velocity,
        last_updated: now.toISOString(),
        next_update: nextUpdate.toISOString(),
      }, { onConflict: 'module_code' })

    for (const paper of topPapers) {
      if (paper.doi || paper.arxiv_id) {
        await supabase
          .from('research_papers')
          .upsert({
            title: paper.title,
            abstract: paper.abstract,
            authors: paper.authors,
            published_date: paper.published_date || null,
            doi: paper.doi || null,
            arxiv_id: paper.arxiv_id || null,
            semantic_scholar_id: paper.semantic_scholar_id || null,
            citation_count: paper.citation_count,
            influence_score: paper.influence_score || null,
            source: paper.source,
            url: paper.url,
          }, {
            onConflict: paper.doi ? 'idx_research_papers_doi' : 'idx_research_papers_arxiv',
            ignoreDuplicates: true,
          })
      }
    }

    results.push({ module: mod.code, papers: topPapers.length, velocity })
  }

  return NextResponse.json({
    updated: results.length,
    modules: results,
    timestamp: new Date().toISOString(),
  })
}
