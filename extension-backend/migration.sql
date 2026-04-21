-- Create extension_ingests table
create table if not exists extension_ingests (
  id uuid primary key default gen_random_uuid(),
  type varchar(20) not null check (type in ('course', 'job')),
  country varchar(50) not null check (country in ('saudi', 'malta', 'uk')),
  data jsonb not null,
  student_id uuid,
  created_at timestamptz default now()
);

-- Enable RLS
alter table extension_ingests enable row level security;

-- Create policy to allow all inserts (for demo purposes as per current app style)
create policy "Allow all inserts to extension_ingests"
  on extension_ingests for insert
  with check (true);

-- Create policy to allow all selects
create policy "Allow all selects from extension_ingests"
  on extension_ingests for select
  using (true);
