-- GAP 1: Data provenance columns on curriculum_evolution_log
ALTER TABLE public.curriculum_evolution_log
  ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS freshness_score REAL,
  ADD COLUMN IF NOT EXISTS provenance_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS faculty_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS faculty_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS faculty_approved_by TEXT;

-- GAP 2: Closed-loop policy experiment engine
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  metric TEXT NOT NULL,
  target_value REAL DEFAULT 0,
  current_value REAL DEFAULT 0,
  promote_threshold REAL DEFAULT 80,
  rollback_threshold REAL DEFAULT 30,
  status TEXT DEFAULT 'draft',
  country TEXT DEFAULT 'saudi',
  outcome_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GAP 3: AI audit log for governance transparency
CREATE TABLE IF NOT EXISTS public.ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  user_id UUID,
  request_payload JSONB DEFAULT '{}',
  response_payload JSONB DEFAULT '{}',
  model_used TEXT NOT NULL,
  latency_ms INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  country TEXT,
  track TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_log_endpoint ON public.ai_audit_log(endpoint);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_created ON public.ai_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_experiments_country ON public.experiments(country);
