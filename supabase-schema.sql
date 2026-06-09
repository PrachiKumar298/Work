-- ============================================================
-- Inventive RAG — Supabase Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles ────────────────────────────────────────────────
-- Extends Supabase auth.users with display metadata.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null,
  email       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Projects ─────────────────────────────────────────────────
create table if not exists public.projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Documents ────────────────────────────────────────────────
create table if not exists public.documents (
  id               uuid primary key default uuid_generate_v4(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  name             text not null,
  type             text not null check (type in ('PDF','DOCX','TXT')),
  status           text not null default 'pending' check (status in ('pending','processed','failed')),
  extracted_text   text,
  extraction_error text,
  chunk_count      integer not null default 0,
  uploaded_at      timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Chunks ───────────────────────────────────────────────────
-- Each processed document is split into overlapping text chunks
-- for retrieval.  Tokens are stored as a text array for fast
-- keyword search without a vector extension dependency.
create table if not exists public.chunks (
  id           uuid primary key default uuid_generate_v4(),
  document_id  uuid not null references public.documents(id) on delete cascade,
  project_id   uuid not null references public.projects(id) on delete cascade,
  source       text not null,
  chunk_number integer not null,
  content      text not null,
  tokens       text[] not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists chunks_project_id_idx  on public.chunks (project_id);
create index if not exists chunks_document_id_idx on public.chunks (document_id);

-- ── Conversations ────────────────────────────────────────────
-- Stores every user + AI message turn for a project.
create table if not exists public.conversation_messages (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null check (role in ('user','ai')),
  text        text not null,
  citations   text[] not null default '{}',
  context     text,
  created_at  timestamptz not null default now()
);

create index if not exists messages_project_id_idx on public.conversation_messages (project_id);

-- ── Seed Data ────────────────────────────────────────────────
-- The JavaScript seed data is loaded at runtime by the app.
-- The schema itself ships empty — each authenticated user
-- sees only their own rows (enforced by RLS below).

-- ── Row Level Security ───────────────────────────────────────
alter table public.profiles             enable row level security;
alter table public.projects             enable row level security;
alter table public.documents            enable row level security;
alter table public.chunks               enable row level security;
alter table public.conversation_messages enable row level security;

-- profiles: users can only see/edit their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- projects: full CRUD for owner
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

-- documents: full CRUD for owner
create policy "documents_select_own" on public.documents
  for select using (auth.uid() = user_id);
create policy "documents_insert_own" on public.documents
  for insert with check (auth.uid() = user_id);
create policy "documents_update_own" on public.documents
  for update using (auth.uid() = user_id);
create policy "documents_delete_own" on public.documents
  for delete using (auth.uid() = user_id);

-- chunks: readable by the document owner
create policy "chunks_select_own" on public.chunks
  for select using (
    auth.uid() = (
      select user_id from public.documents where id = document_id limit 1
    )
  );
create policy "chunks_insert_own" on public.chunks
  for insert with check (
    auth.uid() = (
      select user_id from public.documents where id = document_id limit 1
    )
  );
create policy "chunks_delete_own" on public.chunks
  for delete using (
    auth.uid() = (
      select user_id from public.documents where id = document_id limit 1
    )
  );

-- conversation_messages: full CRUD for owner
create policy "messages_select_own" on public.conversation_messages
  for select using (auth.uid() = user_id);
create policy "messages_insert_own" on public.conversation_messages
  for insert with check (auth.uid() = user_id);
create policy "messages_delete_own" on public.conversation_messages
  for delete using (auth.uid() = user_id);

-- ── Auto-update updated_at ───────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_projects
  before update on public.projects
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_documents
  before update on public.documents
  for each row execute procedure public.set_updated_at();

-- ── Handle new-user signup ────────────────────────────────────
-- Automatically creates a profile row when Supabase Auth creates
-- a new user (works with email/password sign-up).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
