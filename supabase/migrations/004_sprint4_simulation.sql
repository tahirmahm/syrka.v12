-- Sprint 4: Simulation, comparison, and student profile tables

create table if not exists simulation_jobs (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  prescription_id uuid,
  seed_document text,
  status text default 'pending',
  mirofish_job_id text,
  scenario_weights jsonb,
  anchor_results jsonb,
  result jsonb,
  expected_value numeric,
  optimistic_bound numeric,
  pessimistic_bound numeric,
  confidence_level text,
  support_score numeric,
  top_resistance text,
  created_at timestamptz default now()
);

create index if not exists idx_sim_jobs_country on simulation_jobs(country);
create index if not exists idx_sim_jobs_status on simulation_jobs(status);
create index if not exists idx_sim_jobs_prescription on simulation_jobs(prescription_id);

create table if not exists scenario_comparisons (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  simulation_a_id uuid references simulation_jobs(id),
  simulation_b_id uuid references simulation_jobs(id),
  syrka_opinion text,
  recommended_prescription_id uuid,
  created_at timestamptz default now()
);

create table if not exists student_profiles (
  id uuid primary key default gen_random_uuid(),
  country text,
  sector_interest text,
  self_assessed_skills jsonb,
  vision_aligned_careers jsonb,
  skill_gap_score numeric,
  created_at timestamptz default now()
);

create index if not exists idx_student_profiles_country on student_profiles(country);
