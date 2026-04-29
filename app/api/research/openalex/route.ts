import { NextRequest, NextResponse } from 'next/server'
import { getModule } from '@/lib/degree-config'
import { buildQueryForModule } from '@/lib/research'
import type { ResearchPaper } from '@/lib/research'

const OA_BASE = 'https://api.openalex.org'

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
  const mailto = process.env.OPENALEX_MAILTO ?? 'syrka@example.com'
  const url = `${OA_BASE}/works?search=${encodeURIComponent(query)}&per_page=5&sort=publication_date:desc&mailto=${encodeURIComponent(mailto)}`

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': `Syrka/1.0 (${mailto})` },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `OpenAlex returned ${response.status}` }, { status: 502 })
    }

    const json = await response.json()
    const papers: ResearchPaper[] = (json.results ?? []).map((w: Record<string, unknown>) => {
      const authorships = (w.authorships as { author: { display_name: string } }[] | null) ?? []
      const ids = w.ids as Record<string, string> | null
      const biblio = w.biblio as Record<string, string> | null
      const doi = (w.doi as string | null)?.replace('https://doi.org/', '')
      return {
        title: (w.display_name as string) ?? '',
        abstract: '',
        authors: authorships.slice(0, 5).map(a => a.author.display_name),
        published_date: (w.publication_date as string) ?? '',
        doi: doi ?? undefined,
        arxiv_id: undefined,
        citation_count: (w.cited_by_count as number) ?? 0,
        source: 'openalex' as const,
        url: (ids?.openalex as string) ?? (w.id as string) ?? '',
      }
    })

    return NextResponse.json({
      module: moduleCode,
      source: 'openalex',
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
