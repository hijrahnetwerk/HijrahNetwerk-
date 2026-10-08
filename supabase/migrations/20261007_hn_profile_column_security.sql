-- HN security hardening: keep sensitive profile fields out of normal member queries.
-- RLS controls rows, not columns. The normal authenticated role must not be able to
-- read member email, WhatsApp number or internal admin fields.
begin;

revoke select on public.profiles from anon, authenticated;
grant select (id, role) on public.profiles to authenticated;

drop function if exists public.hn_admin_profiles();
create or replace function public.hn_admin_profiles()
returns setof public.profiles
language sql
security definer
set search_path = public
stable
as $$
  select p.*
  from public.profiles p
  where public.is_admin();
$$;

revoke all on function public.hn_admin_profiles() from public;
grant execute on function public.hn_admin_profiles() to authenticated;

commit;
