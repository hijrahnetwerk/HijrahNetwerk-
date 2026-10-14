-- Fix for public search analytics inserts.
-- The identity column on hn_search_events uses a sequence; anon/authenticated
-- need sequence usage so inserts from the public search page can succeed.

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'hn_search_events_id_seq'
      and n.nspname = 'public'
      and c.relkind = 'S'
  ) then
    execute 'grant usage, select on sequence public.hn_search_events_id_seq to anon, authenticated';
  end if;
end $$;
