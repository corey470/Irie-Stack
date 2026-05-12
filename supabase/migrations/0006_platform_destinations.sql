-- Named posting destinations for pages, profiles, schedulers, and feeds.
-- Secret token values stay in environment variables; this table stores the
-- private account/page identifiers and the env var names needed to publish.

create table if not exists public.platform_destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null
    check (platform in ('x', 'linkedin', 'threads', 'instagram', 'facebook', 'tiktok', 'substack')),
  label text not null,
  external_id text,
  external_type text not null default 'profile'
    check (external_type in ('profile', 'page', 'company_page', 'scheduler_profile', 'publication')),
  posting_strategy text not null default 'direct'
    check (posting_strategy in ('direct', 'scheduler')),
  access_token_env_key text,
  scheduler_profile_id_env_key text,
  is_default boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_destinations_user_id_idx
  on public.platform_destinations(user_id);
create index if not exists platform_destinations_platform_idx
  on public.platform_destinations(platform);
create unique index if not exists platform_destinations_one_default_idx
  on public.platform_destinations(user_id, platform)
  where is_default;
create unique index if not exists platform_destinations_label_idx
  on public.platform_destinations(user_id, platform, lower(label));

drop trigger if exists platform_destinations_updated_at on public.platform_destinations;
create trigger platform_destinations_updated_at
  before update on public.platform_destinations
  for each row execute function public.set_updated_at();

alter table public.platform_destinations enable row level security;

drop policy if exists "platform_destinations: owner can select" on public.platform_destinations;
create policy "platform_destinations: owner can select"
  on public.platform_destinations for select
  using ((select auth.uid()) = user_id);

drop policy if exists "platform_destinations: owner can insert" on public.platform_destinations;
create policy "platform_destinations: owner can insert"
  on public.platform_destinations for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "platform_destinations: owner can update" on public.platform_destinations;
create policy "platform_destinations: owner can update"
  on public.platform_destinations for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "platform_destinations: owner can delete" on public.platform_destinations;
create policy "platform_destinations: owner can delete"
  on public.platform_destinations for delete
  using ((select auth.uid()) = user_id);

alter table public.content_pieces
  add column if not exists destination_id uuid references public.platform_destinations(id) on delete set null;

create index if not exists content_pieces_destination_id_idx
  on public.content_pieces(destination_id);
