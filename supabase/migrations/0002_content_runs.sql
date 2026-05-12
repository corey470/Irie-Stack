-- IrieStack content run foundation
-- Source material becomes durable runs, and runs own typed pieces that can
-- later flow into approval/autopilot/posting agents.

-- ============================================================
-- content_sources
-- ============================================================
create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'paste'
    check (type in ('paste', 'url', 'topic', 'upload')),
  title text,
  input_text text not null,
  input_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists content_sources_user_id_idx
  on public.content_sources(user_id);

alter table public.content_sources enable row level security;

drop policy if exists "content_sources: owner can select" on public.content_sources;
create policy "content_sources: owner can select"
  on public.content_sources for select
  using ((select auth.uid()) = user_id);

drop policy if exists "content_sources: owner can insert" on public.content_sources;
create policy "content_sources: owner can insert"
  on public.content_sources for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "content_sources: owner can update" on public.content_sources;
create policy "content_sources: owner can update"
  on public.content_sources for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "content_sources: owner can delete" on public.content_sources;
create policy "content_sources: owner can delete"
  on public.content_sources for delete
  using ((select auth.uid()) = user_id);

-- ============================================================
-- content_runs
-- ============================================================
create table if not exists public.content_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.content_sources(id) on delete set null,
  stack_id uuid references public.context_stacks(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  name text not null default 'Untitled run',
  status text not null default 'drafted'
    check (status in ('drafting', 'drafted', 'queued', 'posting', 'completed', 'failed')),
  target_days integer not null default 30 check (target_days between 1 and 90),
  starts_on date not null default current_date,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_runs_user_id_idx
  on public.content_runs(user_id);
create index if not exists content_runs_source_id_idx
  on public.content_runs(source_id);
create index if not exists content_runs_status_idx
  on public.content_runs(status);

drop trigger if exists content_runs_updated_at on public.content_runs;
create trigger content_runs_updated_at
  before update on public.content_runs
  for each row execute function public.set_updated_at();

alter table public.content_runs enable row level security;

drop policy if exists "content_runs: owner can select" on public.content_runs;
create policy "content_runs: owner can select"
  on public.content_runs for select
  using ((select auth.uid()) = user_id);

drop policy if exists "content_runs: owner can insert" on public.content_runs;
create policy "content_runs: owner can insert"
  on public.content_runs for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "content_runs: owner can update" on public.content_runs;
create policy "content_runs: owner can update"
  on public.content_runs for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "content_runs: owner can delete" on public.content_runs;
create policy "content_runs: owner can delete"
  on public.content_runs for delete
  using ((select auth.uid()) = user_id);

-- ============================================================
-- content_pieces
-- ============================================================
create table if not exists public.content_pieces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null references public.content_runs(id) on delete cascade,
  source_id uuid references public.content_sources(id) on delete set null,
  platform text not null
    check (platform in ('x', 'linkedin', 'threads', 'instagram', 'facebook', 'tiktok', 'substack')),
  level text not null
    check (level in ('level_1', 'level_2', 'level_3')),
  format text not null
    check (format in ('single', 'long_post', 'thread', 'carousel_storyboard', 'note')),
  title text not null,
  hook text,
  body text not null,
  cta text,
  slides jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'pending_approval', 'approved', 'scheduled', 'posted', 'rejected', 'failed')),
  mode text not null default 'approval'
    check (mode in ('approval', 'autopilot')),
  scheduled_for timestamptz,
  approval_request_id text,
  approval_status text
    check (approval_status in ('not_requested', 'pending', 'approved', 'rejected', 'expired', 'cancelled')),
  posted_at timestamptz,
  posted_url text,
  validation jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_pieces_user_id_idx
  on public.content_pieces(user_id);
create index if not exists content_pieces_run_id_idx
  on public.content_pieces(run_id);
create index if not exists content_pieces_status_idx
  on public.content_pieces(status);
create index if not exists content_pieces_scheduled_for_idx
  on public.content_pieces(scheduled_for);
create index if not exists content_pieces_approval_request_id_idx
  on public.content_pieces(approval_request_id);

drop trigger if exists content_pieces_updated_at on public.content_pieces;
create trigger content_pieces_updated_at
  before update on public.content_pieces
  for each row execute function public.set_updated_at();

alter table public.content_pieces enable row level security;

drop policy if exists "content_pieces: owner can select" on public.content_pieces;
create policy "content_pieces: owner can select"
  on public.content_pieces for select
  using ((select auth.uid()) = user_id);

drop policy if exists "content_pieces: owner can insert" on public.content_pieces;
create policy "content_pieces: owner can insert"
  on public.content_pieces for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "content_pieces: owner can update" on public.content_pieces;
create policy "content_pieces: owner can update"
  on public.content_pieces for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "content_pieces: owner can delete" on public.content_pieces;
create policy "content_pieces: owner can delete"
  on public.content_pieces for delete
  using ((select auth.uid()) = user_id);
