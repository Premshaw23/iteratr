-- ═══════════════════════════════════════════════════════════
-- iteratr — Phase 4 Migration Script
-- Run this script in the Supabase SQL Editor if you already
-- have the base schema initialized and want to upgrade it 
-- without dropping your existing users or data.
-- ═══════════════════════════════════════════════════════════

-- 1. Enable Vector support for RAG (Hint Engine)
create extension if not exists "vector";

-- 2. Add new missing columns to existing user table
alter table users add column if not exists streak_freeze_available boolean not null default true;
alter table users add column if not exists last_freeze_used_at timestamptz;
alter table users add column if not exists is_public boolean not null default true;
alter table users add column if not exists unlocked_badges text[] not null default '{}';
alter table users add column if not exists is_pro boolean not null default false;

-- 3. Add daily challenge support to questions
alter table questions add column if not exists is_daily_challenge boolean not null default false;

-- 4. Create Knowledge Base table for storing documentation RAG
create table if not exists knowledge_base (
  id                    uuid        primary key default gen_random_uuid(),
  content               text        not null,
  metadata              jsonb       not null default '{}',
  embedding             vector(768), -- Gemini standard embedding size
  created_at            timestamptz not null default now()
);

-- Ensure public select for knowledge base
alter table knowledge_base enable row level security;
drop policy if exists "Knowledge base is public" on knowledge_base;
create policy "Knowledge base is public"
  on knowledge_base for select using (true);

-- 5. Create Similarity Search Function for AI Mentor
create or replace function match_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    knowledge_base.id,
    knowledge_base.content,
    knowledge_base.metadata,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
