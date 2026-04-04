import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query')
  const country = searchParams.get('country')

  if (!process.env.MIROFISH_URL) {
    return NextResponse.json({ results: [] })
  }

  if (!query || !country) {
    return NextResponse.json({ results: [] })
  }

  try {
    const res = await fetch(
      `${process.env.MIROFISH_URL}/api/chroma/search?query=${encodeURIComponent(query)}&collection=${country}`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ results: [] })
  }
}
