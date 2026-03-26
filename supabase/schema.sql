-- National Visions
create table national_visions (
  id uuid primary key default gen_random_uuid(),
  country varchar(100) not null,
  slug varchar(50) not null unique,
  vision_name varchar(200) not null,
  target_year integer not null,
  description text,
  accent_color varchar(7),
  created_at timestamptz default now()
);

-- Sectors within each vision
create table sectors (
  id uuid primary key default gen_random_uuid(),
  vision_id uuid references national_visions(id) on delete cascade,
  name varchar(200) not null,
  current_workforce integer not null,
  target_workforce integer not null,
  current_year integer not null,
  target_year integer not null,
  priority_score integer check (priority_score between 1 and 10),
  description text,
  icon varchar(50)
);

-- Skills taxonomy
create table skills (
  id uuid primary key default gen_random_uuid(),
  vision_id uuid references national_visions(id) on delete cascade,
  sector_id uuid references sectors(id) on delete cascade,
  name varchar(200) not null,
  category varchar(100),
  current_supply integer not null,
  projected_demand_target_year integer not null,
  annual_growth_rate decimal(5,2),
  gap_score decimal(5,2),
  criticality varchar(20) check (criticality in ('critical','high','medium','low'))
);

-- Educational institutions
create table institutions (
  id uuid primary key default gen_random_uuid(),
  vision_id uuid references national_visions(id) on delete cascade,
  name varchar(300) not null,
  type varchar(50) check (type in ('university','polytechnic','vocational','online')),
  student_count integer,
  annual_graduate_count integer,
  location varchar(200),
  established_year integer,
  national_ranking integer
);

-- Degree/diploma programmes
create table programmes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references institutions(id) on delete cascade,
  name varchar(300) not null,
  level varchar(50) check (level in ('certificate','diploma','bachelor','master','phd')),
  duration_years decimal(3,1),
  annual_intake integer,
  annual_graduates integer,
  overall_alignment_score decimal(5,2),
  employment_rate_6months decimal(5,2),
  avg_starting_salary integer
);

-- Programme to skill mappings
create table programme_skills (
  programme_id uuid references programmes(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  proficiency_level varchar(20) check (proficiency_level in ('awareness','working','practitioner','expert')),
  primary key (programme_id, skill_id)
);

-- Individual courses
create table courses (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid references programmes(id) on delete cascade,
  name varchar(300) not null,
  code varchar(50),
  credits integer,
  year_of_study integer,
  alignment_score decimal(5,2),
  last_updated integer,
  description text
);

-- Course to skill mappings
create table course_skills (
  course_id uuid references courses(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  coverage_level varchar(20) check (coverage_level in ('introduced','developed','mastered')),
  primary key (course_id, skill_id)
);

-- Employers
create table employers (
  id uuid primary key default gen_random_uuid(),
  vision_id uuid references national_visions(id) on delete cascade,
  sector_id uuid references sectors(id),
  name varchar(300) not null,
  size varchar(20) check (size in ('sme','large','enterprise','multinational')),
  open_roles integer,
  graduate_satisfaction_score decimal(3,1),
  avg_time_to_fill_days integer,
  is_vision_partner boolean default false
);

-- Employer skill demands
create table employer_skills (
  employer_id uuid references employers(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  demand_level varchar(20) check (demand_level in ('low','medium','high','critical')),
  open_positions integer,
  urgency_months integer,
  primary key (employer_id, skill_id)
);

-- Synthetic students
create table students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references institutions(id),
  programme_id uuid references programmes(id),
  year_of_study integer,
  vision_alignment_score decimal(5,2),
  employment_readiness_score decimal(5,2),
  nationality varchar(100),
  cohort_year integer
);

-- Student skill profiles
create table student_skills (
  student_id uuid references students(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  proficiency decimal(5,2),
  assessed_at timestamptz default now(),
  primary key (student_id, skill_id)
);

-- Policy scenarios
create table scenarios (
  id uuid primary key default gen_random_uuid(),
  vision_id uuid references national_visions(id),
  name varchar(300) not null,
  sector_id uuid references sectors(id),
  intervention_type varchar(100),
  parameters jsonb not null,
  projected_outcomes jsonb,
  ai_analysis text,
  gap_closure_percentage decimal(5,2),
  cost_estimate_usd bigint,
  roi_5year decimal(5,2),
  created_at timestamptz default now()
);

-- AI analysis cache
create table ai_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key varchar(500) unique not null,
  result jsonb not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

-- Trajectory data points (for gap chart)
create table trajectory_points (
  id uuid primary key default gen_random_uuid(),
  vision_id uuid references national_visions(id),
  sector_id uuid references sectors(id),
  year integer not null,
  current_trajectory integer,
  vision_target integer,
  with_intervention integer,
  data_type varchar(20) check (data_type in ('historical','projected'))
);
