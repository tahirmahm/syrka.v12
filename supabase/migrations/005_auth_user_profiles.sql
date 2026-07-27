-- Migration: user_profiles, job_pipeline, moodle_courses + RLS
-- Run against Supabase project ejzymrrfyezvdiocwsew

-- 1. user_profiles table (links Supabase auth to Syrka)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  github_username TEXT,
  linkedin_data JSONB DEFAULT '{}',
  github_data JSONB DEFAULT '{}',
  resume_text TEXT,
  resume_parsed JSONB DEFAULT '{}',
  extracted_skills JSONB DEFAULT '[]',
  career_identity_statement TEXT,
  country TEXT DEFAULT 'saudi',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. job_pipeline table (stores jobs from extension + manual)
CREATE TABLE IF NOT EXISTS public.job_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_url TEXT,
  description TEXT,
  salary TEXT,
  skills_required JSONB DEFAULT '[]',
  offer_score INTEGER,
  offer_grade TEXT,
  offer_evaluation JSONB DEFAULT '{}',
  cv_brief JSONB DEFAULT '{}',
  status TEXT DEFAULT 'saved',
  source TEXT DEFAULT 'manual',
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. moodle_courses table (stores courses from extension)
CREATE TABLE IF NOT EXISTS public.moodle_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  modules JSONB DEFAULT '[]',
  assignments JSONB DEFAULT '[]',
  extracted_skills JSONB DEFAULT '[]',
  vision_alignment JSONB DEFAULT '[]',
  skill_gaps JSONB DEFAULT '[]',
  course_url TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moodle_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users manage own pipeline" ON public.job_pipeline
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own courses" ON public.moodle_courses
  FOR ALL USING (auth.uid() = user_id);
