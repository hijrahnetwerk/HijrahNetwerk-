begin;
create index if not exists idx_profiles_hn_status on public.profiles (hn_status);

drop policy if exists "Admins manage HN badges" on public.hn_badges;
drop policy if exists "Members can view active HN badges" on public.hn_badges;
create policy "Members and admins can view HN badges" on public.hn_badges for select to authenticated
using ((active = true) or (select private.is_admin()));
create policy "Admins insert HN badges" on public.hn_badges for insert to authenticated
with check ((select private.is_admin()));
create policy "Admins update HN badges" on public.hn_badges for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy "Admins delete HN badges" on public.hn_badges for delete to authenticated
using ((select private.is_admin()));

drop policy if exists "Admins manage HN user badges" on public.hn_user_badges;
drop policy if exists "Members can view HN user badges" on public.hn_user_badges;
create policy "Members and admins can view HN user badges" on public.hn_user_badges for select to authenticated
using (
  (user_id = (select auth.uid()))
  or (select private.is_admin())
  or exists (
    select 1
    from public.profiles p
    join public.hn_badges b on b.id = hn_user_badges.badge_id
    where p.id = hn_user_badges.user_id
      and p.application_status = 'approved'
      and p.profile_visibility = true
      and p.show_contributions = true
      and b.show_on_profile = true
  )
);
create policy "Admins insert HN user badges" on public.hn_user_badges for insert to authenticated
with check ((select private.is_admin()));
create policy "Admins update HN user badges" on public.hn_user_badges for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy "Admins delete HN user badges" on public.hn_user_badges for delete to authenticated
using ((select private.is_admin()));

drop policy if exists "Approved members can view public profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users and approved members can view profiles" on public.profiles for select to authenticated
using (
  (((select auth.uid()) is not null) and application_status = 'approved' and profile_visibility = true)
  or ((select auth.uid()) = id)
  or (select private.is_admin())
);
commit;
