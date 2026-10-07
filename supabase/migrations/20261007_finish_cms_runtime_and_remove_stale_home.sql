-- Complete CMS runtime registry and remove stale empty-slug homepage record.
insert into public.hn_component_definitions
(component_type,label,group_name,description,schema,capabilities,is_active,sort_order)
select 'smart_search','HN Smart Search','HN','Zoekcomponent voor artikelen, fiches en praktische HN-informatie.',
'{"fields":["title","text","data_limit","data_filters"],"data_source":"topics"}'::jsonb,
'{"responsive":true,"data_binding":true}'::jsonb,true,85
where not exists (select 1 from public.hn_component_definitions where component_type='smart_search');

delete from public.hn_site_pages where slug='' and title='Home — huidige versie';
