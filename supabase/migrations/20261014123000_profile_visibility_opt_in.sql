-- Public member profiles are opt-in. Existing default-visible profiles are hidden until the member opts in.
alter table public.profiles
  alter column profile_visibility set default false;

update public.profiles
set profile_visibility = false
where profile_visibility is distinct from false;

create or replace function public.hn_set_my_profile_visibility(p_show boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'Log in om je profielzichtbaarheid te wijzigen.' using errcode = '42501';
  end if;

  update public.profiles
  set profile_visibility = coalesce(p_show, false),
      updated_at = now()
  where id = v_user;

  if not found then
    raise exception 'Je profiel kon niet worden gevonden.' using errcode = 'P0002';
  end if;

  return true;
end;
$$;

revoke all on function public.hn_set_my_profile_visibility(boolean) from public, anon;
grant execute on function public.hn_set_my_profile_visibility(boolean) to authenticated;

-- An administrator may hide a profile for safety, but cannot opt another member in.
create or replace function private.hn_guard_profile_visibility_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is not null and new.profile_visibility is true then
    if tg_op = 'INSERT' and v_user is distinct from new.id then
      raise exception 'Alleen het lid zelf kan profielzichtbaarheid inschakelen.' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE'
      and old.profile_visibility is distinct from true
      and v_user is distinct from new.id then
      raise exception 'Alleen het lid zelf kan profielzichtbaarheid inschakelen.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$;
revoke all on function private.hn_guard_profile_visibility_owner() from public, anon, authenticated;
drop trigger if exists hn_guard_profile_visibility_owner on public.profiles;
create trigger hn_guard_profile_visibility_owner
before insert or update on public.profiles
for each row execute function private.hn_guard_profile_visibility_owner();

-- Ensure profile RPCs never expose real first/last names or verification state.
-- These RPCs are member-facing, and only opted-in approved profiles are returned.
create or replace function public.hn_public_profile(p_id uuid)
returns table(
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
as $$
  select
    p.id,
    p.display_name,
    null::text as first_name,
    null::text as last_name,
    p.bio,
    'approved'::text as application_status,
    null::text as verification_status,
    true as profile_visibility,
    p.show_location,
    p.show_contributions,
    p.show_status,
    case when p.show_location then p.current_country_id else null end,
    case when p.show_location then p.current_city_id else null end,
    case when p.show_status then p.hn_status else null end
  from public.profiles p
  where p.id = p_id
    and p.application_status = 'approved'
    and p.profile_visibility = true
    and (select auth.uid()) is not null;
$$;

create or replace function public.hn_public_profiles(p_ids uuid[])
returns table(
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
as $$
  select
    p.id,
    p.display_name,
    null::text as first_name,
    null::text as last_name,
    p.bio,
    'approved'::text as application_status,
    null::text as verification_status,
    true as profile_visibility,
    p.show_location,
    p.show_contributions,
    p.show_status,
    case when p.show_location then p.current_country_id else null end,
    case when p.show_location then p.current_city_id else null end,
    case when p.show_status then p.hn_status else null end
  from public.profiles p
  where p.id = any(coalesce(p_ids, '{}'::uuid[]))
    and p.application_status = 'approved'
    and p.profile_visibility = true
    and p.show_contributions = true
    and (select auth.uid()) is not null;
$$;

revoke all on function public.hn_public_profile(uuid) from public, anon;
grant execute on function public.hn_public_profile(uuid) to authenticated;
revoke all on function public.hn_public_profiles(uuid[]) from public, anon;
grant execute on function public.hn_public_profiles(uuid[]) to authenticated;
