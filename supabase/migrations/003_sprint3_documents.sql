-- Sprint 3: Document upload table

create table if not exists uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  filename text not null,
  extracted_text text,
  structured_data jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_uploaded_docs_country on uploaded_documents(country);
