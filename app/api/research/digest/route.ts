import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('weekly_digests')
      .select('*')
      .order('week_id', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ digest: null })
    }

    return NextResponse.json({ digest: data })
  } catch {
    return NextResponse.json({ digest: null })
  }
}
