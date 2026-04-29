'use client'

import { useEffect, useState } from 'react'

interface FeedPaper {
  title: string
  authors: string[]
  published_date: string
  citation_count: number
  source: string
  url: string
  doi?: string
  arxiv_id?: string
}

interface FeedData {
  papers: FeedPaper[]
  field_velocity: number
  cached: boolean
  last_updated?: string
}

export default function ResearchFeed({ moduleCode }: { moduleCode: string }) {
  const [feed, setFeed] = useState<FeedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLive(false)

    fetch(`/api/research/feed?module=${moduleCode}`)
      .then(r => r.json())
      .then(async (data: FeedData) => {
        if (cancelled) return
        const hasCached = data.papers && data.papers.length > 0
        if (hasCached) {
          setFeed(data)
          setLoading(false)
          return
        }
        setLive(true)
        try {
          const arxivRes = await fetch(`/api/research/arxiv?module=${moduleCode}`)
          if (cancelled) return
          const arxivData = await arxivRes.json()
          setFeed({
            papers: arxivData.papers ?? [],
            field_velocity: 0,
            cached: false,
          })
        } catch {
          if (!cancelled) setFeed(null)
        }
        if (!cancelled) setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setLive(true)
          fetch(`/api/research/arxiv?module=${moduleCode}`)
            .then(r => r.json())
            .then(data => { if (!cancelled) setFeed({ papers: data.papers ?? [], field_velocity: 0, cached: false }) })
            .catch(() => { if (!cancelled) setFeed(null) })
            .finally(() => { if (!cancelled) setLoading(false) })
        }
      })

    return () => { cancelled = true }
  }, [moduleCode])

  const papers = feed?.papers ?? []
  const velocity = feed?.field_velocity ?? 0

  return (
    <div className="mb-6" style={{ background: '#121316', borderLeft: '3px solid #679cff', padding: '20px 24px' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: '#679cff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Research Feed
          </span>
          {live && !loading && papers.length > 0 && (
            <span style={{
              padding: '2px 8px', fontSize: 10, fontWeight: 700,
              fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em',
              background: 'rgba(103,156,255,0.1)',
              color: '#679cff',
              border: '1px solid rgba(103,156,255,0.2)',
            }}>
              LIVE
            </span>
          )}
          {velocity > 0 && (
            <span style={{
              padding: '2px 8px', fontSize: 10, fontWeight: 700,
              fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em',
              background: velocity > 5 ? 'rgba(103,156,255,0.1)' : 'rgba(69,72,78,0.3)',
              color: velocity > 5 ? '#679cff' : '#73757c',
              border: `1px solid ${velocity > 5 ? 'rgba(103,156,255,0.2)' : 'rgba(69,72,78,0.4)'}`,
            }}>
              {velocity} papers/30d
            </span>
          )}
        </div>
        {feed?.last_updated ? (
          <span style={{ fontSize: 10, color: '#45484e', fontFamily: 'ui-monospace, monospace' }}>
            {new Date(feed.last_updated).toLocaleDateString()}
          </span>
        ) : live && !loading && papers.length > 0 ? (
          <span style={{ fontSize: 10, color: '#45484e', fontFamily: 'ui-monospace, monospace' }}>
            arXiv · just now
          </span>
        ) : null}
      </div>

      {loading ? (
        <div style={{ padding: '16px 0' }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: 3, background: '#679cff', width: '40%', animation: 'pulse 1.5s infinite' }} />
          </div>
          <span style={{ fontSize: 11, color: '#45484e', marginTop: 8 }} className="block">
            {live ? 'Fetching live from arXiv...' : 'Loading research feed...'}
          </span>
        </div>
      ) : papers.length === 0 ? (
        <div style={{ padding: '12px 0' }}>
          <span style={{ fontSize: 12, color: '#45484e' }}>
            No papers found for this module&apos;s topics.
          </span>
        </div>
      ) : (
        <div className="space-y-1">
          {papers.slice(0, 5).map((paper, i) => (
            <a
              key={i}
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              style={{
                padding: '10px 12px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, color: '#e3e5ed', fontWeight: 500, lineHeight: 1.4,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                  }}>
                    {paper.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ fontSize: 11, color: '#73757c' }}>
                      {paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''}
                    </span>
                    {paper.published_date && (
                      <span style={{ fontSize: 10, color: '#45484e', fontFamily: 'ui-monospace, monospace' }}>
                        {paper.published_date.slice(0, 7)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end" style={{ minWidth: 60 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, fontFamily: 'ui-monospace, monospace',
                    color: paper.citation_count > 50 ? '#679cff' : '#73757c',
                  }}>
                    {paper.citation_count}
                  </span>
                  <span style={{ fontSize: 9, color: '#45484e', textTransform: 'uppercase' }}>citations</span>
                  <span style={{
                    fontSize: 9, color: '#45484e', fontFamily: 'ui-monospace, monospace',
                    marginTop: 2, textTransform: 'uppercase',
                  }}>
                    {paper.source.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
