-- HN audit: keep complex custom pages on their working legacy renderers
-- until the CMS engine can reproduce their interactive functionality.
update public.hn_site_pages
set settings = jsonb_set(coalesce(settings,'{}'::jsonb), '{builder_mode}', '"legacy"'::jsonb),
    updated_at = now()
where slug in ('navigatie','kennisbank','smart-search','stappenplan','stedengids','vergelijken','landen');

-- Align persisted site design settings with the current HN Brand Book.
update public.hn_site_settings
set value = jsonb_build_object(
  'primary','#674C2E',
  'accent','#DD842A',
  'gold','#C6A15B',
  'background','#FFFFFF'
),
updated_at = now()
where key='design';
