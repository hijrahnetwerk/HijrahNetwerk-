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

create or replace function public.hn_public_profile(p_id uuid)
returns table (
  id uuid,
  display_name text,
  first_name text,
  last_name text,
  bio text,
  application_status text,
  verification_status text,
  profile_visibility boolean,
  show_location boolean,
  show_contributions boolean,
  show_status boolean,
  current_country_id uuid,
  current_city_id uuid,
  hn_status text
)
language sql
security definer
set search_path = public
stable
as $
  select p.id,p.display_name,p.first_name,p.last_name,p.bio,p.application_status,
         p.verification_status,p.profile_visibility,p.show_location,p.show_contributions,
         p.show_status,p.current_country_id,p.current_city_id,p.hn_status
  from public.profiles p
  where p.id = p_id
    and p.application_status = 'approved'
    and p.profile_visibility = true
    and auth.uid() is not null;
$;

create or replace function public.hn_public_profiles(p_ids uuid[])
returns table (
  id uuid,
  display_name text,
  first_name text,
  last_name text,
  bio text,
  application_status text,
  verification_status text,
  profile_visibility boolean,
  show_location boolean,
  show_contributions boolean,
  show_status boolean,
  current_country_id uuid,
  current_city_id uuid,
  hn_status text
)
language sql
security definer
set search_path = public
stable
as $
  select p.id,p.display_name,p.first_name,p.last_name,p.bio,p.application_status,
         p.verification_status,p.profile_visibility,p.show_location,p.show_contributions,
         p.show_status,p.current_country_id,p.current_city_id,p.hn_status
  from public.profiles p
  where p.id = any(p_ids)
    and p.application_status = 'approved'
    and p.profile_visibility = true
    and p.show_contributions = true
    and auth.uid() is not null;
$;

revoke all on function public.hn_public_profile(uuid) from public;
revoke all on function public.hn_public_profiles(uuid[]) from public;
grant execute on function public.hn_public_profile(uuid) to authenticated;
grant execute on function public.hn_public_profiles(uuid[]) to authenticated;

commit;
