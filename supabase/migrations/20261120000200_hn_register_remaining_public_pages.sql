-- Register remaining public-facing static pages in the CMS publication list.
-- Dynamic templates and private member/admin screens are intentionally excluded.
insert into public.hn_site_pages
  (slug,title,description,page_type,status,seo_title,seo_description,settings)
values
  ('auteursrecht','Auteursrecht & gebruik','Afspraken over het gebruik van HN-informatie en bijdragen.','standard','draft','Auteursrecht & gebruik | Hijrah Netwerk','Afspraken over het gebruik van HN-informatie en bijdragen.','{"builder_mode":"legacy"}'::jsonb),
  ('bijdragen','Bijdragen','Deel informatie, ervaringen of correcties met Hijrah Netwerk.','community','draft','Bijdragen | Hijrah Netwerk','Deel informatie, ervaringen of correcties met Hijrah Netwerk.','{"builder_mode":"legacy"}'::jsonb),
  ('handboek','Handboek','Praktische uitleg en werkwijze van Hijrah Netwerk.','standard','draft','Handboek | Hijrah Netwerk','Praktische uitleg en werkwijze van Hijrah Netwerk.','{"builder_mode":"legacy"}'::jsonb),
  ('hijrahtools','HijrahTools','Overzicht van hulpmiddelen van oriëntatie tot integratie.','tool','draft','HijrahTools | Hijrah Netwerk','Overzicht van hulpmiddelen van oriëntatie tot integratie.','{"builder_mode":"legacy"}'::jsonb),
  ('privacy','Privacyverklaring','Lees hoe Hijrah Netwerk met persoonsgegevens omgaat.','standard','draft','Privacyverklaring | Hijrah Netwerk','Lees hoe Hijrah Netwerk met persoonsgegevens omgaat.','{"builder_mode":"legacy"}'::jsonb),
  ('home','Oude Home','Een oudere zelfstandige Home-pagina, apart beschikbaar om te vergelijken.','home','draft','Oude Home | Hijrah Netwerk','Een oudere zelfstandige Home-pagina.','{"builder_mode":"legacy","homepage_candidate":true}'::jsonb)
on conflict (slug) do nothing;
