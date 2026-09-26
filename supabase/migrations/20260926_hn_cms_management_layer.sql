-- HN CMS management layer
create table if not exists public.hn_site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.hn_site_page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.hn_site_pages(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(page_id, version_number)
);
create table if not exists public.hn_site_blocks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  block_type text not null default 'content',
  content jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.hn_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.hn_site_settings enable row level security;
alter table public.hn_site_page_versions enable row level security;
alter table public.hn_site_blocks enable row level security;
alter table public.hn_admin_audit_log enable row level security;
drop policy if exists "Public can view site settings" on public.hn_site_settings;
create policy "Public can view site settings" on public.hn_site_settings for select using (true);
drop policy if exists "Admins manage site settings" on public.hn_site_settings;
create policy "Admins manage site settings" on public.hn_site_settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage page versions" on public.hn_site_page_versions;
create policy "Admins manage page versions" on public.hn_site_page_versions for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage site blocks" on public.hn_site_blocks;
create policy "Admins manage site blocks" on public.hn_site_blocks for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage audit log" on public.hn_admin_audit_log;
create policy "Admins manage audit log" on public.hn_admin_audit_log for all using (public.is_admin()) with check (public.is_admin());
drop trigger if exists trg_hn_site_blocks_updated_at on public.hn_site_blocks;
create trigger trg_hn_site_blocks_updated_at before update on public.hn_site_blocks for each row execute function public.hn_touch_updated_at();
insert into public.hn_site_settings(key,value) values
('site','{"name":"Hijrah Netwerk","tagline":"Een netwerk voor emigranten, van oriëntatie tot integratie."}'::jsonb),
('design','{"primary":"#684a25","accent":"#df842c","gold":"#e9a74b","background":"#faf7f2"}'::jsonb)
on conflict (key) do nothing;
