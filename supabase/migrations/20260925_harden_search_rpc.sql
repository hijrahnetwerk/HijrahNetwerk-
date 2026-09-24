-- Security hardening for HN search RPCs
-- Applied to the production Supabase project on 2026-09-25.
--
-- log_hn_search_event only inserts into hn_search_events, which already has
-- a public INSERT policy. It therefore does not need SECURITY DEFINER.
alter function public.log_hn_search_event(text,text,integer,uuid,text) security invoker;
revoke execute on function public.log_hn_search_event(text,text,integer,uuid,text) from public;
grant execute on function public.log_hn_search_event(text,text,integer,uuid,text) to anon, authenticated;

-- Search overview contains aggregate search analytics and is admin-only.
-- The admin dashboard currently does not call this RPC directly.
revoke execute on function public.get_hn_search_overview() from anon, authenticated;
