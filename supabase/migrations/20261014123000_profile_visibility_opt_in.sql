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

