-- HN security hardening: only explicitly public site settings may be read by visitors.
begin;
drop policy if exists "Public can view site settings" on public.hn_site_settings;
create policy "Public can view public site settings"
on public.hn_site_settings
for select
to anon, authenticated
using (key in ('site','design'));
commit;