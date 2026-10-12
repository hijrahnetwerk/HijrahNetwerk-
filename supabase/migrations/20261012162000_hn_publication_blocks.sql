-- HN Publicatiebouwer: gestructureerde artikelblokken en redactionele onderbouwing.
alter table public.blogs
  add column if not exists content_blocks jsonb not null default '[]'::jsonb,
  add column if not exists sources jsonb not null default '[]'::jsonb,
  add column if not exists verification_status text not null default 'not_checked',
  add column if not exists last_verified_at date,
  add column if not exists consent_confirmed boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'blogs_content_blocks_array_check'
      and conrelid = 'public.blogs'::regclass
  ) then
    alter table public.blogs
      add constraint blogs_content_blocks_array_check
      check (jsonb_typeof(content_blocks) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'blogs_sources_array_check'
      and conrelid = 'public.blogs'::regclass
  ) then
    alter table public.blogs
      add constraint blogs_sources_array_check
      check (jsonb_typeof(sources) = 'array');
  end if;
end $$;

alter table public.blogs drop constraint if exists blogs_type_check;
alter table public.blogs add constraint blogs_type_check
  check (type = any (array['verhaal','interview','ervaring','artikel','blog','gids']::text[]));

alter table public.blogs drop constraint if exists blogs_verification_status_check;
alter table public.blogs add constraint blogs_verification_status_check
  check (verification_status = any (array['not_checked','personal_experience','source_checked','officially_verified','needs_review','outdated']::text[]));

comment on column public.blogs.content_blocks is
  'Gestructureerde HN-publicatieblokken voor verhalende en interactieve artikelen; legacy content blijft behouden.';
comment on column public.blogs.sources is
  'Publieke bronvermeldingen als JSON-array met label en URL.';
comment on column public.blogs.verification_status is
  'Redactionele status: onderscheid tussen persoonlijke ervaring en gecontroleerde feiten.';
comment on column public.blogs.consent_confirmed is
  'Admin bevestigt dat toestemming voor publicatie van het verhaal of interview is verkregen.';
