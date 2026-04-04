-- Sprint 1: International data layer tables

-- International statistics from World Bank, ILO, OECD, UNESCO, WEF
create table if not exists international_stats (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  source text not null,
  indicator_code text not null,
  indicator_name text not null,
  year integer not null,
  value numeric,
  unit text,
  fetched_at timestamptz default now(),
  unique(country_code, source, indicator_code, year)
);

-- ESCO skill mappings for courses
create table if not exists course_skill_mappings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  esco_skill_uri text not null,
  esco_skill_label text not null,
  relevance_score numeric,
  mapped_at timestamptz default now()
);

-- University rankings (QS, THE)
create table if not exists university_rankings (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references institutions(id) on delete set null,
  institution_name text not null,
  ranking_system text not null,
  year integer not null,
  overall_rank text,
  overall_score numeric,
  ar_score numeric, ar_rank text,
  er_score numeric, er_rank text,
  fsr_score numeric, fsr_rank text,
  cpf_score numeric, cpf_rank text,
  ifr_score numeric, ifr_rank text,
  isr_score numeric, isr_rank text,
  isd_score numeric, isd_rank text,
  irn_score numeric, irn_rank text,
  eo_score numeric, eo_rank text,
  sus_score numeric, sus_rank text,
  the_teaching numeric,
  the_research_environment numeric,
  the_research_quality numeric,
  the_international_outlook numeric,
  the_industry numeric,
  location_code text,
  country text,
  size text,
  focus text,
  research text,
  status text,
  region text,
  unique(institution_name, ranking_system, year)
);

-- Peer country groups for benchmarking
create table if not exists peer_groups (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  peer_country_codes text[] not null,
  similarity_basis text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_intl_stats_country on international_stats(country_code);
create index if not exists idx_intl_stats_source on international_stats(source);
create index if not exists idx_intl_stats_indicator on international_stats(indicator_code);
create index if not exists idx_rankings_institution on university_rankings(institution_name);
create index if not exists idx_rankings_system_year on university_rankings(ranking_system, year);
create index if not exists idx_course_skill_mappings_course on course_skill_mappings(course_id);

-- Seed peer groups
insert into peer_groups (country_code, peer_country_codes, similarity_basis)
values
  ('MT', ARRAY['CY', 'EE', 'SI', 'LU'], 'Small EU economies with high-value sector ambitions'),
  ('SA', ARRAY['AE', 'QA', 'BH', 'KW'], 'GCC economies with post-oil diversification goals')
on conflict do nothing;
