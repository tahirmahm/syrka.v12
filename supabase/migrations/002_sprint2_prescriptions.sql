-- Sprint 2: Prescription engine tables

create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  sector text not null,
  title text not null,
  what_to_do text not null,
  why_closes_gap text,
  gap_closure_percent numeric,
  cost_estimate text,
  timeline text,
  key_risk text,
  esco_skill_codes text[],
  wef_skill_alignment jsonb,
  ranking_impact jsonb,
  confidence_score numeric,
  lever text,
  status text default 'not_simulated',
  created_at timestamptz default now()
);

create index if not exists idx_prescriptions_country on prescriptions(country);
create index if not exists idx_prescriptions_sector on prescriptions(country, sector);
