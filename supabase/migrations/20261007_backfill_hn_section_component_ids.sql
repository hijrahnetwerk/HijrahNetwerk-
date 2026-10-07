update public.hn_site_sections
set component_id=coalesce(component_id,'cmp-'||replace(lower(coalesce(section_type,'component')),' ','-')||'-'||left(replace(id::text,'-',''),8)),
    component_type=coalesce(component_type,section_type),
    data=coalesce(data,'{}'::jsonb),
    settings=coalesce(settings,'{}'::jsonb)
where component_id is null or component_type is null;
