begin;
update public.hn_site_pages set settings=jsonb_set(coalesce(settings,'{}'::jsonb),'{builder_mode}','"cms"'::jsonb,true), updated_at=now()
where slug in ('kennisbank','navigatie','smart-search','stedengids','vergelijken','landen');

delete from public.hn_site_sections where page_id in (select id from public.hn_site_pages where slug in ('kennisbank','navigatie','smart-search','stedengids','vergelijken','landen'));

insert into public.hn_site_sections(page_id,section_type,title,content,sort_order,is_visible)
select id,'hero',title,jsonb_build_object('title',title,'text',
case slug when 'kennisbank' then 'Lees uitleg, ervaringen en praktische informatie die je helpt bij je hijrah.' when 'navigatie' then 'Zoek concreet. Van een school of arts tot een wijk, moskee, winkel of andere plek.' when 'smart-search' then 'Beschrijf gewoon wat je zoekt. Smart Search zoekt in gepubliceerde HN-informatie.' when 'stedengids' then 'Bekijk per stad welke praktische HN-informatie beschikbaar is.' when 'vergelijken' then 'Zet steden naast elkaar op basis van informatie die in HN beschikbaar is.' when 'landen' then 'Ontdek landen en steden en verzamel praktische informatie voor jouw hijrah.' end),0,true
from public.hn_site_pages where slug in ('kennisbank','navigatie','smart-search','stedengids','vergelijken','landen');

insert into public.hn_site_sections(page_id,section_type,title,content,sort_order,is_visible)
select id,case slug when 'kennisbank' then 'articles' when 'navigatie' then 'navigation' when 'smart-search' then 'smart_search' when 'stedengids' then 'cities' when 'vergelijken' then 'comparison' when 'landen' then 'cities' end,
case slug when 'kennisbank' then 'Artikelen en informatie' when 'navigatie' then 'Hijrah Navigatie' when 'smart-search' then 'Zoeken in HN' when 'stedengids' then 'Steden' when 'vergelijken' then 'Steden vergelijken' when 'landen' then 'Landen & steden' end,
jsonb_build_object('title',case slug when 'kennisbank' then 'Artikelen en informatie' when 'navigatie' then 'Hijrah Navigatie' when 'smart-search' then 'Zoeken in HN' when 'stedengids' then 'Steden' when 'vergelijken' then 'Steden vergelijken' when 'landen' then 'Landen & steden' end,'text',case slug when 'kennisbank' then 'Informatie, ervaringen en inzichten uit HN.' when 'navigatie' then 'Zoek in concrete HN-informatie en ontdek wat er per stad beschikbaar is.' when 'smart-search' then 'Gebruik gewone woorden. HN zoekt binnen gepubliceerde content.' when 'stedengids' then 'De gids groeit mee met de HN-database.' when 'vergelijken' then 'Vergelijk zonder een algemene winnaar aan te wijzen.' when 'landen' then 'Bekijk beschikbare landen en steden.' end,'data_limit',18,'data_source',case slug when 'kennisbank' then 'topics' when 'navigatie' then 'navigation' when 'smart-search' then 'topics' when 'stedengids' then 'cities' when 'vergelijken' then 'comparison' when 'landen' then 'cities' end),1,true
from public.hn_site_pages where slug in ('kennisbank','navigatie','smart-search','stedengids','vergelijken','landen');

insert into public.hn_site_sections(page_id,section_type,title,content,sort_order,is_visible)
select id,'cta','Verder zoeken',jsonb_build_object('title','Verder zoeken','text','Wil je iets concreets vinden? Gebruik Hijrah Navigatie of Smart Search.','button','Naar Hijrah Navigatie','url','/navigatie'),2,true
from public.hn_site_pages where slug in ('kennisbank','navigatie','smart-search','stedengids','vergelijken','landen');
commit;