-- HN content editor + CMS write permissions
create table if not exists public.hn_content_overrides (id uuid primary key default gen_random_uuid(), route text not null, selector text not null, element_type text, original_text text, content_text text not null, updated_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(route, selector));
alter table public.hn_content_overrides enable row level security;
grant select on public.hn_content_overrides to anon, authenticated;
grant insert, update, delete on public.hn_content_overrides to authenticated;
drop policy if exists "Public can read content overrides" on public.hn_content_overrides;
create policy "Public can read content overrides" on public.hn_content_overrides for select to anon, authenticated using (true);
drop policy if exists "Admins manage content overrides" on public.hn_content_overrides;
create policy "Admins manage content overrides" on public.hn_content_overrides for all to authenticated using ((select is_admin())) with check ((select is_admin()));
grant select, insert, update, delete on public.hn_site_pages to authenticated;
grant select, insert, update, delete on public.hn_site_sections to authenticated;
grant select, insert, update, delete on public.hn_site_page_versions to authenticated;
grant select, insert, update, delete on public.hn_admin_audit_log to authenticated;