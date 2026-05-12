-- Irie Social Relay: shared queue for social posts from any Irie product.
-- IrieStack content pieces can keep their richer generation tables, while
-- Commerce, Ziggy, Transportation, and future apps submit generic relay posts.

create table if not exists public.social_relay_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_id uuid references public.platform_destinations(id) on delete set null,
  source_app text not null default 'irie-stack',
  source_record_id text,
  platform text not null
    check (platform in ('x', 'linkedin', 'threads', 'instagram', 'facebook', 'tiktok', 'substack')),
  title text not null default 'Untitled post',
  body text not null,
  media jsonb not null default '[]'::jsonb,
  status text not null default 'pending_approval'
    check (status in ('draft', 'pending_approval', 'approved', 'scheduled', 'posted', 'rejected', 'failed')),
  mode text not null default 'approval'
    check (mode in ('approval', 'autopilot')),
  scheduled_for timestamptz,
  posted_at timestamptz,
  posted_url text,
  validation jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_relay_posts_user_id_idx
  on public.social_relay_posts(user_id);
create index if not exists social_relay_posts_destination_id_idx
  on public.social_relay_posts(destination_id);
create index if not exists social_relay_posts_source_idx
  on public.social_relay_posts(source_app, source_record_id);
create index if not exists social_relay_posts_status_idx
  on public.social_relay_posts(status);
create index if not exists social_relay_posts_scheduled_for_idx
  on public.social_relay_posts(scheduled_for);

drop trigger if exists social_relay_posts_updated_at on public.social_relay_posts;
create trigger social_relay_posts_updated_at
  before update on public.social_relay_posts
  for each row execute function public.set_updated_at();

alter table public.social_relay_posts enable row level security;

drop policy if exists "social_relay_posts: owner can select" on public.social_relay_posts;
create policy "social_relay_posts: owner can select"
  on public.social_relay_posts for select
  using ((select auth.uid()) = user_id);

drop policy if exists "social_relay_posts: owner can insert" on public.social_relay_posts;
create policy "social_relay_posts: owner can insert"
  on public.social_relay_posts for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "social_relay_posts: owner can update" on public.social_relay_posts;
create policy "social_relay_posts: owner can update"
  on public.social_relay_posts for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "social_relay_posts: owner can delete" on public.social_relay_posts;
create policy "social_relay_posts: owner can delete"
  on public.social_relay_posts for delete
  using ((select auth.uid()) = user_id);
