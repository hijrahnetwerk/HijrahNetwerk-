drop policy if exists "Admins manage HN statuses" on public.hn_statuses;
create policy "Admins insert HN statuses" on public.hn_statuses for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update HN statuses" on public.hn_statuses for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete HN statuses" on public.hn_statuses for delete to authenticated using ((select private.is_admin()));
create index if not exists hn_user_badges_awarded_by_idx on public.hn_user_badges(awarded_by);
create index if not exists hn_user_badges_badge_id_idx on public.hn_user_badges(badge_id);