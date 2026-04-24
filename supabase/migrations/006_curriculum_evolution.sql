-- Curriculum evolution log (nightly AI-generated reading recommendations)
CREATE TABLE IF NOT EXISTS public.curriculum_evolution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id),
  recommendations JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  model_version TEXT DEFAULT 'deepseek-chat'
);
