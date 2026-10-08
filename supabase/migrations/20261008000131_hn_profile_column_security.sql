begin;

revoke select on public.profiles from anon, authenticated;
revoke insert on public.profiles from anon, authenticated;
grant select (
  id, role, application_status, verification_status, display_name, first_name,
  last_name, bio, profile_visibility, show_location, show_contributions,
  show_status, current_country_id, current_city_id, hn_status
) on public.profiles to authenticated;
grant update on public.profiles to authenticated;

create or replace function public.hn_admin_profiles()
returns setof public.profiles
language sql
stable
security definer
set search_path = ''
as $$
  select p.* from public.profiles p
  where (select private.is_admin());
$$;
revoke execute on function public.hn_admin_profiles() from public, anon;
grant execute on function public.hn_admin_profiles() to authenticated;

create or replace function public.hn_public_profile(p_id uuid)
returns table (
  id uuid, display_name text, first_name text, last_name text, bio text,
  application_status text, verification_status text, profile_visibility boolean,
  show_location boolean, show_contributions boolean, show_status boolean,
  current_country_id uuid, current_city_id uuid, hn_status text
)
language sql stable security invoker set search_path = ''
as $$
  select p.id,p.display_name,p.first_name,p.last_name,p.bio,p.application_status,
         p.verification_status,p.profile_visibility,p.show_location,p.show_contributions,
         p.show_status,p.current_country_id,p.current_city_id,p.hn_status
  from public.profiles p
  where p.id=p_id
    and p.application_status='approved'
    and p.profile_visibility=true
    and (select auth.uid()) is not null;
$$;
revoke execute on function public.hn_public_profile(uuid) from public, anon;
grant execute on function public.hn_public_profile(uuid) to authenticated;

create or replace function public.hn_public_profiles(p_ids uuid[])
returns table (
  id uuid, display_name text, first_name text, last_name text, bio text,
  application_status text, verification_status text, profile_visibility boolean,
  show_location boolean, show_contributions boolean, show_status boolean,
  current_country_id uuid, current_city_id uuid, hn_status text
)
language sql stable security invoker set search_path = ''
as $$
  select p.id,p.display_name,p.first_name,p.last_name,p.bio,p.application_status,
         p.verification_status,p.profile_visibility,p.show_location,p.show_contributions,
         p.show_status,p.current_country_id,p.current_city_id,p.hn_status
  from public.profiles p
  where p.id=any(p_ids)
    and p.application_status='approved'
    and p.profile_visibility=true
    and p.show_contributions=true
    and (select auth.uid()) is not null;
$$;
revoke execute on function public.hn_public_profiles(uuid[]) from public, anon;
grant execute on function public.hn_public_profiles(uuid[]) to authenticated;

create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    if new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.application_status is distinct from old.application_status
       or new.verification_status is distinct from old.verification_status
       or new.whatsapp_verified is distinct from old.whatsapp_verified
       or new.admin_notes is distinct from old.admin_notes
       or new.access_code_used is distinct from old.access_code_used
       or new.approved_at is distinct from old.approved_at
       or new.hn_status is distinct from old.hn_status
       or new.created_at is distinct from old.created_at then
      raise exception 'Deze profielvelden kunnen alleen door HN worden gewijzigd.';
    end if;
  end if;
  new.updated_at=now();
  return new;
end;
$$;
revoke execute on function public.protect_profile_admin_fields() from public, anon, authenticated;

drop policy if exists "Users can create pending profile" on public.profiles;

create or replace function public.is_admin()
returns boolean
language sql stable security invoker set search_path = ''
as $$ select (select private.is_admin()); $$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

commit;