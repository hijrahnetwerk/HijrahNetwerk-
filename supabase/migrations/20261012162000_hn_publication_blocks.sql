-- HN Publicatiebouwer: gestructureerde artikelblokken naast bestaande legacy-tekst.
alter table public.blogs
  add column if not exists content_blocks jsonb not null default '[]'::jsonb;

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
end $$;

comment on column public.blogs.content_blocks is
  'Gestructureerde HN-publicatieblokken voor verhalende en interactieve artikelen; legacy content blijft behouden.';
