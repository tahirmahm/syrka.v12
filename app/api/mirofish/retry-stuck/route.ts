import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.MIROFISH_URL) {
    return NextResponse.json({ skipped: true, reason: 'MIROFISH_URL not set' })
  }

  const supabase = createClient()

  // Find jobs stuck in 'running' for more than 20 minutes
  const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString()

  const { data: stuckJobs, error } = await supabase
    .from('simulation_jobs')
    .select('id, mirofish_job_id')
    .eq('status', 'running')
    .lt('created_at', twentyMinutesAgo)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: Array<{ id: string; newStatus: string }> = []

  for (const job of stuckJobs ?? []) {
    if (!job.mirofish_job_id) {
      // No MiroFish job ID — mark as failed
      await supabase
        .from('simulation_jobs')
        .update({ status: 'failed' })
        .eq('id', job.id)
      results.push({ id: job.id, newStatus: 'failed' })
      continue
    }

    try {
      const res = await fetch(
        `${process.env.MIROFISH_URL}/api/status/${job.mirofish_job_id}`,
        { signal: AbortSignal.timeout(10000) }
      )
      const data = await res.json()

      if (data.status === 'complete') {
        await supabase
          .from('simulation_jobs')
          .update({ status: 'complete', result: data.result })
          .eq('id', job.id)
        results.push({ id: job.id, newStatus: 'complete' })
      } else if (data.status === 'failed') {
        await supabase
          .from('simulation_jobs')
          .update({ status: 'failed' })
          .eq('id', job.id)
        results.push({ id: job.id, newStatus: 'failed' })
      } else {
        // Still running but over 20 min — mark failed
        await supabase
          .from('simulation_jobs')
          .update({ status: 'failed' })
          .eq('id', job.id)
        results.push({ id: job.id, newStatus: 'failed' })
      }
    } catch {
      await supabase
        .from('simulation_jobs')
        .update({ status: 'failed' })
        .eq('id', job.id)
      results.push({ id: job.id, newStatus: 'failed' })
    }
  }

  return NextResponse.json({ recovered: results.length, results })
}
