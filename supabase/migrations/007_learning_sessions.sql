-- Learning sessions (tracks student progress over time)
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_date DATE DEFAULT CURRENT_DATE,
  modules_viewed JSONB DEFAULT '[]',
  time_spent_minutes INTEGER DEFAULT 0,
  skills_demonstrated JSONB DEFAULT '[]',
  velocity_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
