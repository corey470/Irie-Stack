-- Content profile funnel foundation.
-- Onboarding/context is the root, and harvested research becomes durable
-- content fuel that can flow into posting runs.

alter table public.context_stacks
  add column if not exists profile jsonb not null default '{}'::jsonb,
  add column if not exists links jsonb not null default '[]'::jsonb,
  add column if not exists onboarding_completed_at timestamptz;

create table if not exists public.research_fuel (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stack_id uuid references public.context_stacks(id) on delete set null,
  source_type text not null default 'topic'
    check (source_type in ('url', 'topic')),
  source text not null,
  title text not null,
  summary text not null default '',
  angles jsonb not null default '[]'::jsonb,
  talking_points jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  cautions jsonb not null default '[]'::jsonb,
  source_text text not null default '',
  status text not null default 'ready'
    check (status in ('ready', 'used', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists research_fuel_user_id_idx
  on public.research_fuel(user_id);
create index if not exists research_fuel_stack_id_idx
  on public.research_fuel(stack_id);
create index if not exists research_fuel_status_idx
  on public.research_fuel(status);
create index if not exists research_fuel_created_at_idx
  on public.research_fuel(created_at desc);

drop trigger if exists research_fuel_updated_at on public.research_fuel;
create trigger research_fuel_updated_at
  before update on public.research_fuel
  for each row execute function public.set_updated_at();

alter table public.research_fuel enable row level security;

drop policy if exists "research_fuel: owner can select" on public.research_fuel;
create policy "research_fuel: owner can select"
  on public.research_fuel for select
  using ((select auth.uid()) = user_id);

drop policy if exists "research_fuel: owner can insert" on public.research_fuel;
create policy "research_fuel: owner can insert"
  on public.research_fuel for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "research_fuel: owner can update" on public.research_fuel;
create policy "research_fuel: owner can update"
  on public.research_fuel for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "research_fuel: owner can delete" on public.research_fuel;
create policy "research_fuel: owner can delete"
  on public.research_fuel for delete
  using ((select auth.uid()) = user_id);
