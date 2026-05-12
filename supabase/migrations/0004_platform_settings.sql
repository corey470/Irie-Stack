-- Per-platform control settings.

create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null
    check (platform in ('x', 'linkedin', 'threads', 'instagram', 'facebook', 'tiktok', 'substack')),
  mode text not null default 'approval'
    check (mode in ('approval', 'autopilot', 'paused')),
  is_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

create index if not exists platform_settings_user_id_idx
  on public.platform_settings(user_id);

drop trigger if exists platform_settings_updated_at on public.platform_settings;
create trigger platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;

drop policy if exists "platform_settings: owner can select" on public.platform_settings;
create policy "platform_settings: owner can select"
  on public.platform_settings for select
  using ((select auth.uid()) = user_id);

drop policy if exists "platform_settings: owner can insert" on public.platform_settings;
create policy "platform_settings: owner can insert"
  on public.platform_settings for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "platform_settings: owner can update" on public.platform_settings;
create policy "platform_settings: owner can update"
  on public.platform_settings for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "platform_settings: owner can delete" on public.platform_settings;
create policy "platform_settings: owner can delete"
  on public.platform_settings for delete
  using ((select auth.uid()) = user_id);
