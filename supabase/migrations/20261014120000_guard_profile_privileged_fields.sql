-- Prevent self-service profile writes from escalating privileges.
-- Migration file only: apply to production only as part of the final release.
create or replace function private.hn_guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_is_admin boolean := coalesce((select private.is_admin()), false);
begin
  -- Server-side jobs without an end-user JWT retain their existing service workflow.
  if v_user is null or v_is_admin then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.id is distinct from v_user then
      raise exception 'Je kunt alleen je eigen profiel aanmaken.' using errcode = '42501';
    end if;
    new.role := 'member';
    new.application_status := 'pending';
    new.admin_notes := null;
    new.approved_at := null;
    new.verification_status := 'unverified';
    new.hn_status := 'lid';
    new.whatsapp_verified := false;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id then
      raise exception 'Een profiel-ID kan niet worden gewijzigd.' using errcode = '42501';
    end if;
    if new.role is distinct from old.role
      or new.application_status is distinct from old.application_status
      or new.admin_notes is distinct from old.admin_notes
      or new.approved_at is distinct from old.approved_at
      or new.verification_status is distinct from old.verification_status
      or new.hn_status is distinct from old.hn_status
      or new.whatsapp_verified is distinct from old.whatsapp_verified then
      raise exception 'Deze profielvelden kunnen alleen door HN-beheer worden gewijzigd.' using errcode = '42501';
    end if;
    return new;
  end if;

  return new;
end;
$$;

revoke all on function private.hn_guard_profile_privileged_fields() from public, anon, authenticated;

drop trigger if exists hn_guard_profile_privileged_fields on public.profiles;
create trigger hn_guard_profile_privileged_fields
before insert or update on public.profiles
for each row execute function private.hn_guard_profile_privileged_fields();
