-- HN fix: profiel-updates voor goedgekeurde leden
-- Maakt veilige profielwijzigingen mogelijk zonder dat leden
-- beschermde accountvelden kunnen aanpassen.

alter table public.profiles enable row level security;

drop policy if exists "Users can update safe profile fields" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
  or public.is_admin()
)
with check (
  (select auth.uid()) = id
  or public.is_admin()
);

create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and (select auth.uid()) = old.id then
    if new.role is distinct from old.role
       or new.application_status is distinct from old.application_status
       or new.verification_status is distinct from old.verification_status
       or new.whatsapp_verified is distinct from old.whatsapp_verified
       or new.admin_notes is distinct from old.admin_notes
       or new.access_code_used is distinct from old.access_code_used
       or new.approved_at is distinct from old.approved_at then
      raise exception 'Deze profielvelden kunnen alleen door HN worden gewijzigd.';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_profile_admin_fields on public.profiles;

create trigger protect_profile_admin_fields
before update on public.profiles
for each row
execute function public.protect_profile_admin_fields();

grant execute on function public.protect_profile_admin_fields() to authenticated;
