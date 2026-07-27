import { createClient } from '@/lib/supabase'

export async function logAudit(entry: {
  endpoint: string
  user_id?: string | null
  request_payload: Record<string, unknown>
  response_payload: Record<string, unknown>
  model_used: string
  latency_ms: number
  tokens_used?: number
  country?: string | null
  track: string
}) {
  try {
    const supabase = createClient()
    await supabase.from('ai_audit_log').insert(entry)
  } catch {}
}
