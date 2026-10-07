-- Fix Data API privileges for the HN navigation editor.
-- RLS remains enabled; policies continue to control which rows can be changed.

grant select, insert, update, delete on public.hn_navigation_items to authenticated;
alter table public.hn_navigation_items enable row level security;
