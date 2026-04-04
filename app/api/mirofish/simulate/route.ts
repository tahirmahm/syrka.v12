import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (!process.env.MIROFISH_URL) {
    return NextResponse.json(
      { error: 'simulation_unavailable' },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const res = await fetch(`${process.env.MIROFISH_URL}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Simulation request failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    )
  }
}
