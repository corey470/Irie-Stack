-- IrieStack Phase 1 Slice 1 — initial schema
-- Tables: context_stacks, jobs, waitlist
-- All user-scoped tables get RLS with per-user policies.

-- Helper: updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- context_stacks
-- ============================================================
create table if not exists public.context_stacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Stack',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists context_stacks_user_id_idx
  on public.context_stacks(user_id);

drop trigger if exists context_stacks_updated_at on public.context_stacks;
create trigger context_stacks_updated_at
  before update on public.context_stacks
  for each row execute function public.set_updated_at();

alter table public.context_stacks enable row level security;

create policy "context_stacks: owner can select"
  on public.context_stacks for select
  using (auth.uid() = user_id);

create policy "context_stacks: owner can insert"
  on public.context_stacks for insert
  with check (auth.uid() = user_id);

create policy "context_stacks: owner can update"
  on public.context_stacks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "context_stacks: owner can delete"
  on public.context_stacks for delete
  using (auth.uid() = user_id);

-- ============================================================
-- jobs
-- ============================================================
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stack_id uuid references public.context_stacks(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  payload jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_user_id_idx on public.jobs(user_id);
create index if not exists jobs_stack_id_idx on public.jobs(stack_id);
create index if not exists jobs_status_idx on public.jobs(status);

drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;

create policy "jobs: owner can select"
  on public.jobs for select
  using (auth.uid() = user_id);

create policy "jobs: owner can insert"
  on public.jobs for insert
  with check (auth.uid() = user_id);

create policy "jobs: owner can update"
  on public.jobs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "jobs: owner can delete"
  on public.jobs for delete
  using (auth.uid() = user_id);

-- ============================================================
-- waitlist (public landing-page submission)
-- ============================================================
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Anonymous users can INSERT (the public landing form). Nobody can SELECT
-- or modify rows from the client — admin reads happen server-side via
-- the service role key, which bypasses RLS by design.
create policy "waitlist: anyone can insert"
  on public.waitlist for insert
  with check (true);
