-- ═══════════════════════════════════════════════════════════
-- iteratr — Supabase Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "pgcrypto";
-- Enable Vector support for RAG
create extension if not exists "vector";

-- ── users ────────────────────────────────────────────────────
create table if not exists users (
  id                  text        primary key,
  email               text        unique not null,
  display_name        text        not null,
  avatar_url          text,
  preferred_language  text        not null default 'python'
                                  check (preferred_language in ('python','cpp','javascript')),
  elo_rating          integer     not null default 1200,
  streak_count        integer     not null default 0,
  longest_streak      integer     not null default 0,
  reflection_text     text,
  streak_freeze_available boolean     not null default true,
  last_freeze_used_at timestamptz,
  is_public           boolean     not null default true,
  unlocked_badges     text[]      not null default '{}',
  is_pro              boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── questions ────────────────────────────────────────────────
create table if not exists questions (
  id                  uuid        primary key default gen_random_uuid(),
  type                text        not null
                                  check (type in ('mcq','fill','code','order')),
  topic               text        not null
                                  check (topic in (
                                    'arrays','trees','graphs','dynamic_programming',
                                    'linked_lists','system_design','os_concepts',
                                    'networking','mixed'
                                  )),
  subtopic            text        not null,
  difficulty_elo      integer     not null,
  problem_statement   text        not null,
  payload             jsonb       not null,
  hints               text[]      not null default '{}',
  explanation         text        not null default '',
  tags                text[]      not null default '{}',
  is_daily_challenge  boolean     not null default false,
  created_at          timestamptz not null default now()
);

-- ── attempts ─────────────────────────────────────────────────
create table if not exists attempts (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             text        not null references users(id) on delete cascade,
  question_id         uuid        not null references questions(id) on delete cascade,
  submitted_answer    text        not null,
  is_correct          boolean     not null,
  hints_used          integer     not null default 0,
  time_taken_seconds  integer     not null default 0,
  elo_before          integer     not null,
  elo_after           integer     not null,
  elo_change          integer     not null,
  created_at          timestamptz not null default now()
);

-- ── sessions ─────────────────────────────────────────────────
create table if not exists sessions (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             text        not null references users(id) on delete cascade,
  session_type        text        not null check (session_type in ('practice','interview')),
  config              jsonb       not null default '{}',
  score_code          integer,
  score_comms         integer,
  score_speed         integer,
  transcript          jsonb,
  completed           boolean     not null default false,
  created_at          timestamptz not null default now()
);

-- ── elo_history ───────────────────────────────────────────────
create table if not exists elo_history (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             text        not null references users(id) on delete cascade,
  elo_before          integer     not null,
  elo_after           integer     not null,
  elo_change          integer     not null,
  reason              text        not null,
  question_id         uuid        references questions(id) on delete set null,
  created_at          timestamptz not null default now()
);

-- ── topic_stats ───────────────────────────────────────────────
create table if not exists topic_stats (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               text        not null references users(id) on delete cascade,
  topic                 text        not null,
  subtopic              text        not null,
  solved_count          integer     not null default 0,
  fail_count            integer     not null default 0,
  is_weak_zone          boolean     not null default false,
  consecutive_correct   integer     not null default 0,
  updated_at            timestamptz not null default now(),
  unique(user_id, subtopic)
);

-- ── knowledge_base (RAG) ──────────────────────────────────────
create table if not exists knowledge_base (
  id                    uuid        primary key default gen_random_uuid(),
  content               text        not null,
  metadata              jsonb       not null default '{}',
  embedding             vector(768), -- Gemini standard embedding size
  created_at            timestamptz not null default now()
);

-- ── Similarity Search Function ──
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

-- ═══════════════════════════════════════════════════════════
-- INDEXES — speeds up common queries
-- ═══════════════════════════════════════════════════════════
create index if not exists idx_attempts_user     on attempts(user_id);
create index if not exists idx_attempts_question on attempts(question_id);
create index if not exists idx_elo_history_user  on elo_history(user_id, created_at desc);
create index if not exists idx_topic_stats_user  on topic_stats(user_id);
create index if not exists idx_questions_elo     on questions(difficulty_elo);
create index if not exists idx_questions_topic   on questions(topic);
create index if not exists idx_sessions_user     on sessions(user_id, created_at desc);

-- ═══════════════════════════════════════════════════════════
-- AUTO-UPDATE updated_at on users
-- ═══════════════════════════════════════════════════════════
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_updated_at on users;
create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════
alter table users        enable row level security;
alter table attempts     enable row level security;
alter table sessions     enable row level security;
alter table elo_history  enable row level security;
alter table topic_stats  enable row level security;

-- Questions are public (everyone can read)
alter table questions    enable row level security;
create policy "Questions are public"
  on questions for select using (true);

-- Users can only read/update their own row
create policy "Users: read own"
  on users for select using (auth.uid()::text = id);
create policy "Users: update own"
  on users for update using (auth.uid()::text = id);

-- Attempts: own only
create policy "Attempts: read own"
  on attempts for select using (auth.uid()::text = user_id);
create policy "Attempts: insert own"
  on attempts for insert with check (auth.uid()::text = user_id);

-- Sessions: own only
create policy "Sessions: read own"
  on sessions for select using (auth.uid()::text = user_id);
create policy "Sessions: insert own"
  on sessions for insert with check (auth.uid()::text = user_id);
create policy "Sessions: update own"
  on sessions for update using (auth.uid()::text = user_id);

-- Elo history: own only
create policy "Elo history: read own"
  on elo_history for select using (auth.uid()::text = user_id);

-- Topic stats: own only
create policy "Topic stats: read own"
  on topic_stats for select using (auth.uid()::text = user_id);
create policy "Topic stats: upsert own"
  on topic_stats for insert with check (auth.uid()::text = user_id);
create policy "Topic stats: update own"
  on topic_stats for update using (auth.uid()::text = user_id);

-- Knowledge base: public select
alter table knowledge_base enable row level security;
create policy "Knowledge base is public"
  on knowledge_base for select using (true);

-- ═══════════════════════════════════════════════════════════
-- DONE — your schema is ready
-- ═══════════════════════════════════════════════════════════
