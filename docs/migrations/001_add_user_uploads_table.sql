-- Create user_uploads table for private data storage
create table if not exists user_uploads (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references users(id) on delete cascade,
  type          text not null check (type in ('learning_goals', 'notes', 'code_snippets', 'interview_prep', 'other')),
  title         text not null,
  content       text not null,
  tags          text[] default '{}',
  is_public     boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Indexes for performance
create index on user_uploads (user_id, created_at desc);
create index on user_uploads (type);
create index on user_uploads (is_public) where is_public = true;

-- Enable RLS if needed (optional - for row-level security)
alter table user_uploads enable row level security;

-- RLS policy: Users can only see their own uploads
create policy "Users can view their own uploads"
  on user_uploads for select
  using (auth.uid()::text = user_id);

-- RLS policy: Users can insert their own uploads
create policy "Users can insert their own uploads"
  on user_uploads for insert
  with check (auth.uid()::text = user_id);

-- RLS policy: Users can delete their own uploads
create policy "Users can delete their own uploads"
  on user_uploads for delete
  using (auth.uid()::text = user_id);

-- RLS policy: Users can update their own uploads
create policy "Users can update their own uploads"
  on user_uploads for update
  using (auth.uid()::text = user_id);
