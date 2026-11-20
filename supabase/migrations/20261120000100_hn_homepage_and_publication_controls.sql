-- HN homepage selector and page publication controls.
-- The existing index.html is preserved as a separate, selectable start page.
begin;

insert into public.hn_site_pages
  (slug,title,description,page_type,status,seo_title,seo_description,settings)
values
  ('startpagina','Startpagina','De oorspronkelijke startpagina van Hijrah Netwerk, afzonderlijk bewaard en vrij te activeren.','home','published',
   'Startpagina | Hijrah Netwerk','Een netwerk voor emigranten, van oriëntatie tot integratie.',
   '{"homepage_candidate":true,"source":"index.html"}'::jsonb)
on conflict (slug) do update set
  title=excluded.title,
  description=excluded.description,
  page_type=excluded.page_type,
  settings=coalesce(public.hn_site_pages.settings,'{}'::jsonb) || excluded.settings;

insert into public.hn_site_settings(key,value)
values ('site','{"name":"Hijrah Netwerk","homepage_slug":"","tagline":"Een netwerk voor emigranten, van oriëntatie tot integratie."}'::jsonb)
on conflict (key) do update set
  value=coalesce(public.hn_site_settings.value,'{}'::jsonb) || jsonb_build_object('homepage_slug',coalesce(public.hn_site_settings.value->>'homepage_slug','')),
  updated_at=now();

commit;
