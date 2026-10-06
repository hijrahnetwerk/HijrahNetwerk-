-- Fix HN navigation/CMS API access and function search path.
-- Idempotent: the live database may already contain these fixes.

grant select on public.hn_navigation_items to anon, authenticated;
grant select on public.hn_site_settings to anon, authenticated;

alter function public.hn_touch_updated_at()
  set search_path = public, pg_temp;

update public.hn_navigation_items
set is_visible = false
where label in ('Artikels','Smart Search');

update public.hn_navigation_items
set href = '/orientatie'
where label = 'HijrahTools';

update public.hn_navigation_items
set href = '/#over-ons'
where label = 'Over HN';
