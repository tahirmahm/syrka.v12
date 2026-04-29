-- 009_research_intelligence.sql
-- Research Intelligence Engine tables for Sprint 2A

create table if not exists research_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  abstract text,
  authors text[],
  published_date date,
  doi text,
  arxiv_id text,
  semantic_scholar_id text,
  citation_count integer default 0,
  influence_score decimal(5,2),
  source varchar(50),
  url text,
  fetched_at timestamptz default now()
);

create unique index if not exists idx_research_papers_doi on research_papers(doi) where doi is not null;
create unique index if not exists idx_research_papers_arxiv on research_papers(arxiv_id) where arxiv_id is not null;
create index if not exists idx_research_papers_published on research_papers(published_date desc);

create table if not exists paper_module_links (
  paper_id uuid references research_papers(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  skill_id uuid references skills(id) on delete set null,
  relevance_score decimal(5,2),
  linked_at timestamptz default now(),
  primary key (paper_id, course_id)
);

create table if not exists research_feed_cache (
  module_code varchar(20) primary key,
  papers jsonb not null default '[]'::jsonb,
  field_velocity integer default 0,
  last_updated timestamptz default now(),
  next_update timestamptz
);

create table if not exists weekly_digests (
  week_id varchar(10) primary key,
  content text not null,
  paper_count integer default 0,
  top_velocity_module varchar(20),
  created_at timestamptz default now()
);
