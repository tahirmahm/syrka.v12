import { NextResponse } from 'next/server'

export async function GET() {
  if (!process.env.MIROFISH_URL) {
    return NextResponse.json({ status: 'unavailable' })
  }
  try {
    const res = await fetch(`${process.env.MIROFISH_URL}/health`, {
      signal: AbortSignal.timeout(10000),
    })
    return NextResponse.json({ status: 'ok', upstream: res.status })
  } catch {
    return NextResponse.json({ status: 'cold' })
  }
}
