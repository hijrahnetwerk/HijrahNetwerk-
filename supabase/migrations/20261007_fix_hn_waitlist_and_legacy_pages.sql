begin;
alter table public.launch_waitlist
  add column if not exists consent_at timestamptz,
  add column if not exists consent_version text;
delete from public.hn_site_pages where slug in ('home-oud','home-huidig');
commit;