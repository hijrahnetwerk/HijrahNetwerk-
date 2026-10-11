-- Hijrah Netwerk: gerichte beveiligingsherstellingen na controle van 11 oktober 2026.
-- Deze migratie wordt pas uitgevoerd wanneer de eigenaar de release goedkeurt.

begin;

-- Voorkom dat een gebruiker zonder bestaande profielrij via INSERT een beheerder,
-- goedgekeurd lid of intern gecontroleerd profiel kan aanmaken.
create or replace function public.protect_profile_admin_fields_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not coalesce((select private.is_admin()), false) then
    new.role := 'member';
    new.application_status := 'pending';
    new.verification_status := 'unverified';
    new.admin_notes := null;
    new.approved_at := null;
    new.whatsapp_verified := false;
    new.access_code_used := null;
    new.hn_status := null;
    new.email := (select u.email from auth.users u where u.id = (select auth.uid()));
  end if;
  return new;
end;
$function$;

drop trigger if exists protect_profile_admin_fields_on_insert on public.profiles;
create trigger protect_profile_admin_fields_on_insert
before insert on public.profiles
for each row execute function public.protect_profile_admin_fields_on_insert();

-- Actieve toegangscodes mogen niet als lijst via de openbare Data API worden uitgelezen.
drop policy if exists "Anon can verify active access code" on public.access_codes;
revoke select on table public.access_codes from anon;

-- anon heeft geen reden om tabelrechten op de interne site-builderblokken te hebben.
revoke all privileges on table public.hn_site_blocks from anon;

commit;
