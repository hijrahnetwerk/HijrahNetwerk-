-- HN visual layout overrides for the existing public pages.
create table if not exists public.hn_page_layout_overrides (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  selector text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(route, selector)
);
alter table public.hn_page_layout_overrides enable row level security;
drop policy if exists "HN layout public read" on public.hn_page_layout_overrides;
drop policy if exists "HN layout admin manage" on public.hn_page_layout_overrides;
create policy "HN layout public read" on public.hn_page_layout_overrides for select to anon, authenticated using (true);
create policy "HN layout admin manage" on public.hn_page_layout_overrides for all to authenticated using ((select is_admin())) with check ((select is_admin()));
grant select on public.hn_page_layout_overrides to anon, authenticated;
grant insert, update, delete on public.hn_page_layout_overrides to authenticated;
create index if not exists hn_page_layout_overrides_route_idx on public.hn_page_layout_overrides(route, sort_order);
