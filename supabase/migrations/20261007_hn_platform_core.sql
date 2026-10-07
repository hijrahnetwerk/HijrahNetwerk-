-- HN platform core: canonical component system, templates and audit trail.
create table if not exists public.hn_component_definitions (
  id uuid primary key default gen_random_uuid(),
  component_type text not null unique,
  label text not null,
  group_name text not null default 'Inhoud',
  description text,
  schema jsonb not null default '{}'::jsonb,
  capabilities jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.hn_page_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  structure jsonb not null default '{"sections":[]}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.hn_admin_events (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  route text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.hn_component_definitions enable row level security;
alter table public.hn_page_templates enable row level security;
alter table public.hn_admin_events enable row level security;
drop policy if exists "HN component definitions public read" on public.hn_component_definitions;
create policy "HN component definitions public read" on public.hn_component_definitions for select to anon, authenticated using (is_active=true);
drop policy if exists "HN component definitions admin manage" on public.hn_component_definitions;
create policy "HN component definitions admin manage" on public.hn_component_definitions for all to authenticated using ((select is_admin())) with check ((select is_admin()));
drop policy if exists "HN templates public read" on public.hn_page_templates;
create policy "HN templates public read" on public.hn_page_templates for select to anon, authenticated using (is_active=true);
drop policy if exists "HN templates admin manage" on public.hn_page_templates;
create policy "HN templates admin manage" on public.hn_page_templates for all to authenticated using ((select is_admin())) with check ((select is_admin()));
drop policy if exists "HN admin events admin read" on public.hn_admin_events;
create policy "HN admin events admin read" on public.hn_admin_events for select to authenticated using ((select is_admin()));
drop policy if exists "HN admin events admin insert" on public.hn_admin_events;
create policy "HN admin events admin insert" on public.hn_admin_events for insert to authenticated with check ((select is_admin()));
grant select on public.hn_component_definitions to anon, authenticated;
grant insert,update,delete on public.hn_component_definitions to authenticated;
grant select on public.hn_page_templates to anon, authenticated;
grant insert,update,delete on public.hn_page_templates to authenticated;
grant select,insert on public.hn_admin_events to authenticated;
create index if not exists hn_component_definitions_active_sort_idx on public.hn_component_definitions(is_active,sort_order);
create index if not exists hn_admin_events_entity_idx on public.hn_admin_events(entity_type,entity_id,created_at desc);
insert into public.hn_component_definitions(component_type,label,group_name,description,schema,capabilities,sort_order) values
('hero','Hero','Pagina','Hoofdboodschap van een pagina.','{"fields":["title","text","button","url","image"]}','{"responsive":true,"data_binding":false}',10),
('intro','Intro','Pagina','Korte introductie onder de hero.','{"fields":["title","text"]}','{"responsive":true,"data_binding":false}',20),
('text','Tekst','Inhoud','Vrije inhoudssectie.','{"fields":["title","text"]}','{"responsive":true,"data_binding":false}',30),
('image','Afbeelding','Inhoud','Afbeelding met optionele toelichting.','{"fields":["title","image","text"]}','{"responsive":true,"data_binding":false}',40),
('cards','Kaarten','Inhoud','Handmatig samengestelde kaarten.','{"fields":["title","cards"]}','{"responsive":true,"data_binding":false}',50),
('cta','CTA','Inhoud','Actieblok met knop.','{"fields":["title","text","button","url"]}','{"responsive":true,"data_binding":false}',60),
('links','Links','Inhoud','Verzameling interne links.','{"fields":["title","text"]}','{"responsive":true,"data_binding":false}',70),
('navigation','HN Navigatie','HN','Dynamische verwijzing naar HN Navigatie.','{"fields":["title","text","data_source","data_limit","data_filters"]}','{"responsive":true,"data_binding":true}',80),
('directory','HN Overzicht','HN','Dynamisch overzicht uit HN-data.','{"fields":["title","text","data_source","data_limit","data_filters"]}','{"responsive":true,"data_binding":true}',90),
('articles','HN Artikelen','HN','Dynamisch overzicht van artikelen/topics.','{"fields":["title","text","data_source","data_limit","data_filters"]}','{"responsive":true,"data_binding":true}',100),
('fiches','HN Fiches','HN','Dynamisch overzicht van fiches.','{"fields":["title","text","data_source","data_limit","data_filters"]}','{"responsive":true,"data_binding":true}',110),
('cities','HN Steden','HN','Dynamisch overzicht van steden.','{"fields":["title","text","data_source","data_limit","data_filters"]}','{"responsive":true,"data_binding":true}',120),
('categories','HN Categorieën','HN','Dynamisch overzicht van categorieën.','{"fields":["title","text","data_source","data_limit","data_filters"]}','{"responsive":true,"data_binding":true}',130),
('comparison','HN Vergelijking','HN','Koppeling naar de vergelijker.','{"fields":["title","text"]}','{"responsive":true,"data_binding":true}',140),
('steps','HN Stappen','HN','Koppeling naar het stappenplan.','{"fields":["title","text"]}','{"responsive":true,"data_binding":true}',150),
('community','HN Community','HN','Koppeling naar de community.','{"fields":["title","text"]}','{"responsive":true,"data_binding":true}',160),
('divider','Scheidingslijn','Layout','Visuele scheiding.','{"fields":[]}','{"responsive":true}',170),
('spacer','Ruimte','Layout','Instelbare witruimte.','{"fields":["height"]}','{"responsive":true}',180)
on conflict (component_type) do update set label=excluded.label,group_name=excluded.group_name,description=excluded.description,schema=excluded.schema,capabilities=excluded.capabilities,sort_order=excluded.sort_order,is_active=true,updated_at=now();
insert into public.hn_page_templates(name,slug,description,structure) values
('Lege pagina','blank','Lege HN-pagina om vanaf nul op te bouwen.','{"sections":[]}'),
('Inhoudspagina','content','Standaard HN-pagina met hero, intro en inhoud.','{"sections":[{"component_type":"hero"},{"component_type":"intro"},{"component_type":"text"}]}'),
('Overzichtspagina','directory','Pagina voor een HN-databaseoverzicht.','{"sections":[{"component_type":"hero"},{"component_type":"directory"},{"component_type":"articles"}]}')
on conflict (slug) do update set description=excluded.description,structure=excluded.structure,is_active=true,updated_at=now();
