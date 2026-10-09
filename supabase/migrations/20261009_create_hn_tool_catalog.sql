-- HN HijrahTools: centraal beheerde toolcatalogus.
-- Persoonlijke voortgang wordt veilig opgeslagen in hijrah_plans.plan_data
-- onder de bestaande RLS-policies (alleen de eigenaar kan zijn eigen plan lezen/schrijven).

create table if not exists public.hn_tool_catalog (
  slug text primary key,
  title text not null,
  description text not null default '',
  phase text not null default 'Oriënteren',
  status text not null default 'beschikbaar'
    check (status in ('beschikbaar', 'beta', 'onderhoud')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint hn_tool_catalog_slug_check check (
    slug in (
      'gereedheidscheck','stedenvergelijker','stappenplan','budgetplanner',
      'stadkeuzehulp','documentencheck','emotionele-voorbereiding',
      'voorzieningenkaart','zusterervaringen','mijn-dashboard'
    )
  )
);

alter table public.hn_tool_catalog enable row level security;

drop policy if exists "Public can read active HN tools" on public.hn_tool_catalog;
create policy "Public can read active HN tools"
  on public.hn_tool_catalog
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage HN tools" on public.hn_tool_catalog;
create policy "Admins manage HN tools"
  on public.hn_tool_catalog
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

grant select on public.hn_tool_catalog to anon, authenticated;
grant insert, update, delete on public.hn_tool_catalog to authenticated;

insert into public.hn_tool_catalog
  (slug, title, description, phase, status, is_active, sort_order)
values
  ('gereedheidscheck','Mijn Hijrah-gereedheidscheck','Een zelftest over inkomen, huisvesting, documenten, onderwijs, zorg en persoonlijke voorbereiding.','Oriënteren','beschikbaar',true,1),
  ('stedenvergelijker','Landen- en stedenvergelijker','Vergelijk zelf onderzochte gegevens over woonkosten, onderwijs, zorg, taal, klimaat en voorzieningen.','Onderzoeken','beschikbaar',true,2),
  ('stappenplan','Mijn Hijrah-stappenplan','Vink stappen af, voeg notities toe en houd je voorbereiding bij per fase.','Voorbereiden','beschikbaar',true,3),
  ('budgetplanner','Hijrah-budgetplanner','Bereken eenmalige vertrekuitgaven, maandelijkse kosten, inkomsten en financiële buffer.','Voorbereiden','beschikbaar',true,4),
  ('stadkeuzehulp','Welke stad past bij ons?','Weeg je persoonlijke prioriteiten en vergelijk steden op basis van jouw eigen onderzoek.','Oriënteren','beschikbaar',true,5),
  ('documentencheck','Documenten- en regelingencheck','Houd documenten, officiële bronlinks en controles per bestemming bij.','Voorbereiden','beschikbaar',true,6),
  ('emotionele-voorbereiding','Emotionele voorbereiding','Orden verwachtingen, zorgen, steunbronnen en kleine vervolgstappen.','Voorbereiden','beschikbaar',true,7),
  ('voorzieningenkaart','Mijn wijk- en voorzieningenkaart','Bewaar zelf onderzochte scholen, zorg, moskeeën, winkels, vervoer en contacten per wijk.','Integreren','beschikbaar',true,8),
  ('zusterervaringen','De ervaring van een andere zuster','Zoek gepubliceerde ervaringen en onderscheid die van officieel bevestigde informatie.','Ervaring & community','beschikbaar',true,9),
  ('mijn-dashboard','Mijn persoonlijke Hijrah-dashboard','Bekijk je voortgang, openstaande taken, budget en opgeslagen informatie op één plek.','Persoonlijk overzicht','beschikbaar',true,10)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  phase = excluded.phase,
  sort_order = excluded.sort_order,
  updated_at = now();

