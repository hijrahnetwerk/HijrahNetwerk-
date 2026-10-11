-- Pre-launch hardening: respect member location visibility and remove
-- table-maintenance privileges from API roles.
begin;

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
stable
security definer
set search_path = ''
as $function$
  select
    p.id,
    p.display_name,
    p.first_name,
    p.last_name,
    p.bio,
    p.application_status,
    p.verification_status,
    p.profile_visibility,
    p.show_location,
    p.show_contributions,
    p.show_status,
    case when p.show_location then p.current_country_id else null end,
    case when p.show_location then p.current_city_id else null end,
    p.hn_status
  from public.profiles p
  where p.id = p_id
    and p.application_status = 'approved'
    and p.profile_visibility = true
    and (select auth.uid()) is not null;
$function$;

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
stable
security definer
set search_path = ''
as $function$
  select
    p.id,
    p.display_name,
    p.first_name,
    p.last_name,
    p.bio,
    p.application_status,
    p.verification_status,
    p.profile_visibility,
    p.show_location,
    p.show_contributions,
    p.show_status,
    case when p.show_location then p.current_country_id else null end,
    case when p.show_location then p.current_city_id else null end,
    p.hn_status
  from public.profiles p
  where p.id = any(p_ids)
    and p.application_status = 'approved'
    and p.profile_visibility = true
    and p.show_contributions = true
    and (select auth.uid()) is not null;
$function$;

revoke all on function public.hn_public_profile(uuid) from public, anon;
revoke all on function public.hn_public_profiles(uuid[]) from public, anon;
revoke all on function public.hn_public_profiles() from public, anon;
grant execute on function public.hn_public_profile(uuid) to authenticated;
grant execute on function public.hn_public_profiles(uuid[]) to authenticated;
grant execute on function public.hn_public_profiles() to authenticated;

-- These privileges are not needed by the browser/Data API. In particular,
-- TRUNCATE bypasses row-level security, so do not leave it on API roles.
revoke truncate, references, trigger, maintain
  on all tables in schema public
  from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables
  from anon, authenticated, service_role;

commit;
