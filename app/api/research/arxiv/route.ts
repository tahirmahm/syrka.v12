import { NextRequest, NextResponse } from 'next/server'
import { getModule } from '@/lib/degree-config'
import { buildArxivQuery } from '@/lib/research'
import type { ResearchPaper } from '@/lib/research'

function parseAtomXml(xml: string): ResearchPaper[] {
  const papers: ResearchPaper[] = []
  const entries = xml.split('<entry>').slice(1)

  for (const entry of entries) {
    const getTag = (tag: string) => {
      const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
      return match ? match[1].trim() : ''
    }

    const title = getTag('title').replace(/\s+/g, ' ')
    const abstract = getTag('summary').replace(/\s+/g, ' ')
    const published = getTag('published').slice(0, 10)

    const authors: string[] = []
    const authorMatches = Array.from(entry.matchAll(/<author>\s*<name>([^<]+)<\/name>/g))
    for (const m of authorMatches) {
      authors.push(m[1].trim())
    }

    const idMatch = entry.match(/<id>([^<]+)<\/id>/)
    const arxivUrl = idMatch ? idMatch[1].trim() : ''
    const arxivId = arxivUrl.replace('http://arxiv.org/abs/', '')

    const doiMatch = entry.match(/<arxiv:doi[^>]*>([^<]+)</)
    const doi = doiMatch ? doiMatch[1].trim() : undefined

    if (title) {
      papers.push({
        title,
        abstract: abstract.slice(0, 1000),
        authors: authors.slice(0, 5),
        published_date: published,
        doi,
        arxiv_id: arxivId,
        citation_count: 0,
        source: 'arxiv',
        url: arxivUrl,
      })
    }
  }
  return papers
}

export async function GET(req: NextRequest) {
  const moduleCode = req.nextUrl.searchParams.get('module')
  if (!moduleCode) {
    return NextResponse.json({ error: 'module param required' }, { status: 400 })
  }

  const mod = getModule(moduleCode)
  if (!mod) {
    return NextResponse.json({ error: 'Unknown module' }, { status: 404 })
  }

  const query = buildArxivQuery(mod)
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending`

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Syrka/1.0 (research-feed)' },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `arXiv returned ${response.status}` }, { status: 502 })
    }

    const xml = await response.text()
    const papers = parseAtomXml(xml)

    return NextResponse.json({
      module: moduleCode,
      source: 'arxiv',
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
