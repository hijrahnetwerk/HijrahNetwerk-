begin;
drop policy if exists "HN component definitions admin manage" on public.hn_component_definitions;
drop policy if exists "HN component definitions public read" on public.hn_component_definitions;
create policy "HN component definitions read" on public.hn_component_definitions for select to anon,authenticated using ((is_active = true) or (select private.is_admin()));
create policy "HN component definitions admin insert" on public.hn_component_definitions for insert to authenticated with check ((select private.is_admin()));
create policy "HN component definitions admin update" on public.hn_component_definitions for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "HN component definitions admin delete" on public.hn_component_definitions for delete to authenticated using ((select private.is_admin()));

drop policy if exists "HN templates admin manage" on public.hn_page_templates;
drop policy if exists "HN templates public read" on public.hn_page_templates;
create policy "HN templates read" on public.hn_page_templates for select to anon,authenticated using ((is_active = true) or (select private.is_admin()));
create policy "HN templates admin insert" on public.hn_page_templates for insert to authenticated with check ((select private.is_admin()));
create policy "HN templates admin update" on public.hn_page_templates for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "HN templates admin delete" on public.hn_page_templates for delete to authenticated using ((select private.is_admin()));

drop policy if exists "HN admin events admin insert" on public.hn_admin_events;
drop policy if exists "HN admin events admin read" on public.hn_admin_events;
create policy "HN admin events admin read" on public.hn_admin_events for select to authenticated using ((select private.is_admin()));
create policy "HN admin events admin insert" on public.hn_admin_events for insert to authenticated with check ((select private.is_admin()));
commit;
