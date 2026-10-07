-- Restore the Data API privileges required by the HN admin editor and member tools.
-- RLS remains enabled and continues to enforce row-level authorization.

grant select, insert, update, delete on public.hn_navigation_items to authenticated;

grant select, insert, update, delete on public.hn_site_pages to authenticated;
grant select, insert, update, delete on public.hn_site_sections to authenticated;
grant select, insert, update, delete on public.hn_site_page_versions to authenticated;
grant select, insert, update, delete on public.hn_site_blocks to authenticated;
grant select, insert, update, delete on public.hn_site_settings to authenticated;

grant select, insert, update, delete on public.hn_dashboard_layouts to authenticated;
grant select, insert, update, delete on public.hn_hijrah_circle to authenticated;

alter table public.hn_navigation_items enable row level security;
alter table public.hn_site_pages enable row level security;
alter table public.hn_site_sections enable row level security;
alter table public.hn_site_page_versions enable row level security;
alter table public.hn_site_blocks enable row level security;
alter table public.hn_site_settings enable row level security;
alter table public.hn_dashboard_layouts enable row level security;
alter table public.hn_hijrah_circle enable row level security;
