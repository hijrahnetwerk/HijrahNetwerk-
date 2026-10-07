begin;

drop policy if exists "Admins can view all activity" on public.user_activity;
drop policy if exists "Users can read own activity" on public.user_activity;
create policy "Users and admins can view activity" on public.user_activity
for select to authenticated
using ((user_id = (select auth.uid())) or (select private.is_admin()));

drop policy if exists "Admins can view all presence" on public.user_presence;
drop policy if exists "Users can read own presence" on public.user_presence;
create policy "Users and admins can view presence" on public.user_presence
for select to authenticated
using ((user_id = (select auth.uid())) or (select private.is_admin()));

commit;