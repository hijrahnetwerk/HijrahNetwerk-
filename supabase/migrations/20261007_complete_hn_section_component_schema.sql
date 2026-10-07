alter table public.hn_site_sections
  add column if not exists component_type text,
  add column if not exists component_id text,
  add column if not exists data jsonb not null default '{}'::jsonb,
  add column if not exists settings jsonb not null default '{}'::jsonb;

update public.hn_site_sections
set component_type=coalesce(component_type,section_type),
    component_id=coalesce(component_id,content->>'component_id'),
    data=case when data='{}'::jsonb then coalesce(content->'data','{}'::jsonb) else data end
where component_type is null or component_id is null or data='{}'::jsonb;
