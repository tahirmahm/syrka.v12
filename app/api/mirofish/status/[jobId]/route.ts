import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  if (!process.env.MIROFISH_URL) {
    return NextResponse.json(
      { error: 'simulation_unavailable' },
      { status: 503 }
    )
  }

  try {
    const { jobId } = await params
    const res = await fetch(
      `${process.env.MIROFISH_URL}/api/status/${jobId}`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Status check failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    )
  }
}
