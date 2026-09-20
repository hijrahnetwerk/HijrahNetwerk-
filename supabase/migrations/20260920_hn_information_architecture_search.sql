-- HN informatie-architectuur + zoeklaag
-- Deze migratie bouwt de databasebasis voor context, relaties en privacyvriendelijke zoekanalyse.
-- Uitvoeren in Supabase SQL Editor vóór de productie-deploy van deze batch.

alter table public.topic
  add column if not exists neighborhood text,
  add column if not exists verification_status text not null default 'pending',
  add column if not exists source_url text;

create index if not exists topic_neighborhood_idx on public.topic(neighborhood);
create index if not exists topic_verification_status_idx on public.topic(verification_status);

create table if not exists public.topic_search_terms (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topic(id) on delete cascade,
  term text not null,
  normalized_term text not null,
  language text not null default 'nl',
  term_type text not null default 'synonym',
  created_at timestamptz not null default now(),
  unique(topic_id, normalized_term, language)
);

create index if not exists topic_search_terms_normalized_idx
  on public.topic_search_terms(normalized_term);
create index if not exists topic_search_terms_topic_idx
  on public.topic_search_terms(topic_id);

create table if not exists public.topic_relationships (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topic(id) on delete cascade,
  related_topic_id uuid not null references public.topic(id) on delete cascade,
  relationship_type text not null default 'related',
  created_at timestamptz not null default now(),
  unique(topic_id, related_topic_id, relationship_type),
  check (topic_id <> related_topic_id)
);

create index if not exists topic_relationships_topic_idx
  on public.topic_relationships(topic_id);
create index if not exists topic_relationships_related_idx
  on public.topic_relationships(related_topic_id);

create table if not exists public.hn_search_events (
  id bigint generated always as identity primary key,
  query text not null,
  normalized_query text not null,
  result_count integer not null default 0,
  clicked_topic_id uuid references public.topic(id) on delete set null,
  event_type text not null default 'search',
  created_at timestamptz not null default now()
);

create index if not exists hn_search_events_query_idx
  on public.hn_search_events(normalized_query);
create index if not exists hn_search_events_created_idx
  on public.hn_search_events(created_at desc);
create index if not exists hn_search_events_no_result_idx
  on public.hn_search_events(result_count) where result_count = 0;

alter table public.topic_search_terms enable row level security;
alter table public.topic_relationships enable row level security;
alter table public.hn_search_events enable row level security;

drop policy if exists "Public search terms are readable" on public.topic_search_terms;
create policy "Public search terms are readable"
on public.topic_search_terms
for select to anon, authenticated
using (
  exists (
    select 1 from public.topic t
    where t.id = topic_id
      and t.published = true
  )
);

drop policy if exists "Public topic relationships are readable" on public.topic_relationships;
create policy "Public topic relationships are readable"
on public.topic_relationships
for select to anon, authenticated
using (
  exists (
    select 1 from public.topic t
    where t.id = topic_id
      and t.published = true
  )
);

drop policy if exists "Public search events can be inserted" on public.hn_search_events;
create policy "Public search events can be inserted"
on public.hn_search_events
for insert to anon, authenticated
with check (
  event_type in ('search','click')
  and length(trim(query)) between 1 and 240
  and length(trim(normalized_query)) between 1 and 240
  and result_count between 0 and 10000
);

-- Zoektermen mogen publiek worden gelezen, maar alleen admins beheren ze.
grant select on public.topic_search_terms to anon, authenticated;
grant select on public.topic_relationships to anon, authenticated;
grant insert on public.hn_search_events to anon, authenticated;

drop policy if exists "Admins manage search terms" on public.topic_search_terms;
create policy "Admins manage search terms"
on public.topic_search_terms
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage topic relationships" on public.topic_relationships;
create policy "Admins manage topic relationships"
on public.topic_relationships
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admins kunnen zoekanalyse bekijken; bezoekers kunnen alleen nieuwe events toevoegen.
drop policy if exists "Admins read search events" on public.hn_search_events;
create policy "Admins read search events"
on public.hn_search_events
for select to authenticated
using (public.is_admin());

grant select, insert, update, delete on public.topic_search_terms to authenticated;
grant select, insert, update, delete on public.topic_relationships to authenticated;
grant select on public.hn_search_events to authenticated;

-- Veelvoorkomende Nederlandse/Franse zoekvarianten kunnen vanaf het begin worden
-- gebruikt zonder dat elke Topic handmatig alle synoniemen hoeft te bevatten.
create or replace function public.hn_normalize_search(p_value text)
returns text
language sql
immutable
as $$
  select trim(regexp_replace(
    regexp_replace(
      lower(unaccent(coalesce(p_value,''))),
      '[^a-z0-9]+',
      ' ',
      'g'
    ),
    '\\s+',
    ' ',
    'g'
  ));
$$;

grant execute on function public.hn_normalize_search(text) to anon, authenticated;

-- Aggregatie voor Admin: geen gebruikers-ID's, alleen zoekgedrag op queryniveau.
create or replace function public.get_hn_search_overview()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  top_queries jsonb;
  no_results jsonb;
  total_searches bigint;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select count(*) into total_searches
  from public.hn_search_events
  where event_type='search';

  select coalesce(jsonb_agg(x order by x.count desc), '[]'::jsonb)
  into top_queries
  from (
    select normalized_query as query, count(*) as count
    from public.hn_search_events
    where event_type='search'
    group by normalized_query
    order by count(*) desc
    limit 50
  ) x;

  select coalesce(jsonb_agg(x order by x.count desc), '[]'::jsonb)
  into no_results
  from (
    select normalized_query as query, count(*) as count
    from public.hn_search_events
    where event_type='search'
      and result_count=0
    group by normalized_query
    order by count(*) desc
    limit 50
  ) x;

  return jsonb_build_object(
    'total_searches', total_searches,
    'top_queries', top_queries,
    'no_result_queries', no_results
  );
end;
$$;

grant execute on function public.get_hn_search_overview() to authenticated;

-- Eerste basis-set voor herkenning. Dit is aanvullende zoeklogica, geen inhoudelijke bron.
insert into public.topic_search_terms (topic_id, term, normalized_term, language, term_type)
select t.id, v.term, public.hn_normalize_search(v.term), v.language, 'synonym'
from public.topic t
cross join lateral (
  values
    ('huisarts','nl'),
    ('dokter','nl'),
    ('arts','nl'),
    ('médecin','fr'),
    ('medecin','fr'),
    ('generaliste','fr'),
    ('school','nl'),
    ('école','fr'),
    ('ecole','fr'),
    ('zorg','nl'),
    ('santé','fr'),
    ('sante','fr')
) v(term, language)
where false
on conflict (topic_id, normalized_term, language) do nothing;
