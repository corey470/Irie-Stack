-- Add Facebook and TikTok as first-class output/posting platforms.

alter table public.content_pieces
  drop constraint if exists content_pieces_platform_check;

alter table public.content_pieces
  add constraint content_pieces_platform_check
  check (platform in ('x', 'linkedin', 'threads', 'instagram', 'facebook', 'tiktok', 'substack'));

alter table public.platform_settings
  drop constraint if exists platform_settings_platform_check;

alter table public.platform_settings
  add constraint platform_settings_platform_check
  check (platform in ('x', 'linkedin', 'threads', 'instagram', 'facebook', 'tiktok', 'substack'));
