import { NextRequest, NextResponse } from 'next/server'
import { getModule } from '@/lib/degree-config'
import { buildQueryForModule } from '@/lib/research'
import type { ResearchPaper } from '@/lib/research'

const S2_BASE = 'https://api.semanticscholar.org/graph/v1'

export async function GET(req: NextRequest) {
  const moduleCode = req.nextUrl.searchParams.get('module')
  if (!moduleCode) {
    return NextResponse.json({ error: 'module param required' }, { status: 400 })
  }

  const mod = getModule(moduleCode)
  if (!mod) {
    return NextResponse.json({ error: 'Unknown module' }, { status: 404 })
  }

  const query = buildQueryForModule(mod)
  const url = `${S2_BASE}/paper/search?query=${encodeURIComponent(query)}&limit=5&fields=title,abstract,authors,year,externalIds,citationCount,influentialCitationCount,url`

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Syrka/1.0 (research-feed)',
    }
    if (process.env.S2_API_KEY) {
      headers['x-api-key'] = process.env.S2_API_KEY
    }

    const response = await fetch(url, { headers })

    if (response.status === 429) {
      return NextResponse.json({ error: 'Semantic Scholar rate limit — retry later' }, { status: 429 })
    }
    if (!response.ok) {
      return NextResponse.json({ error: `S2 returned ${response.status}` }, { status: 502 })
    }

    const json = await response.json()
    const papers: ResearchPaper[] = (json.data ?? []).map((p: Record<string, unknown>) => {
      const externalIds = p.externalIds as Record<string, string> | null
      const authors = (p.authors as { name: string }[] | null) ?? []
      return {
        title: (p.title as string) ?? '',
        abstract: ((p.abstract as string) ?? '').slice(0, 1000),
        authors: authors.slice(0, 5).map(a => a.name),
        published_date: p.year ? `${p.year}-01-01` : '',
        doi: externalIds?.DOI,
        arxiv_id: externalIds?.ArXiv,
        semantic_scholar_id: p.paperId as string,
        citation_count: (p.citationCount as number) ?? 0,
        influence_score: (p.influentialCitationCount as number) ?? 0,
        source: 'semantic_scholar' as const,
        url: (p.url as string) ?? '',
      }
    })

    return NextResponse.json({
      module: moduleCode,
      source: 'semantic_scholar',
      query,
      count: papers.length,
      papers,
    })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}
