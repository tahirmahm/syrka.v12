import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const supabase = createClient()

  const { error } = await supabase
    .from('curriculum_evolution_log')
    .update({
      faculty_approved: true,
      faculty_approved_at: new Date().toISOString(),
      faculty_approved_by: body.approvedBy || 'faculty',
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ approved: true })
}
