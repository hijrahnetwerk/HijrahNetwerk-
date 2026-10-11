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


-- Beheerfuncties voor verwijderen en herordenen schrijven zelf een auditregel.
create or replace function public.hn_admin_delete_badge(p_badge_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_name text;
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception 'Alleen HN-beheerders.' using errcode = '42501';
  end if;

  select b.name into v_name
  from public.hn_badges b
  where b.id = p_badge_id
  for update;

  if not found then
    raise exception 'Badge niet gevonden.' using errcode = 'P0002';
  end if;

  delete from public.hn_badges where id = p_badge_id;
 
  -- De DELETE-trigger hn_audit_badges_config legt de actie vast.
  return true;
end;
$function$;

create or replace function public.hn_admin_reorder_badges(p_items jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_count integer;
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception 'Alleen HN-beheerders.' using errcode = '42501';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 500 then
    raise exception 'Ongeldige badgevolgorde.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as x(id uuid, sort_order integer)
    left join public.hn_badges b on b.id = x.id
    where b.id is null or x.sort_order is null
  ) then
    raise exception 'De volgorde bevat een onbekende badge of ongeldige positie.' using errcode = '22023';
  end if;

  update public.hn_badges b
  set sort_order = x.sort_order, updated_at = now()
  from jsonb_to_recordset(p_items) as x(id uuid, sort_order integer)
  where b.id = x.id;

  get diagnostics v_count = row_count;
 
  -- De UPDATE-trigger hn_audit_badges_config legt de gewijzigde badges vast.
  return true;
end;
$function$;

revoke all on function public.hn_admin_delete_badge(uuid) from public, anon;
revoke all on function public.hn_admin_reorder_badges(jsonb) from public, anon;
grant execute on function public.hn_admin_delete_badge(uuid) to authenticated;
grant execute on function public.hn_admin_reorder_badges(jsonb) to authenticated;


-- Openbare profiel-RPC's blijven dezelfde vorm teruggeven voor compatibiliteit,
-- maar lekken geen moderatie-/verificatiestatus en respecteren show_status.
create or replace function public.hn_public_profile(p_id uuid)
returns table(
  id uuid, display_name text, first_name text, last_name text, bio text,
  application_status text, verification_status text, profile_visibility boolean,
  show_location boolean, show_contributions boolean, show_status boolean,
  current_country_id uuid, current_city_id uuid, hn_status text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    p.id,
    p.display_name,
    null::text as first_name,
    null::text as last_name,
    p.bio,
    null::text as application_status,
    null::text as verification_status,
    p.profile_visibility,
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
$function$;

create or replace function public.hn_public_profiles(p_ids uuid[])
returns table(
  id uuid, display_name text, first_name text, last_name text, bio text,
  application_status text, verification_status text, profile_visibility boolean,
  show_location boolean, show_contributions boolean, show_status boolean,
  current_country_id uuid, current_city_id uuid, hn_status text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    p.id,
    p.display_name,
    null::text as first_name,
    null::text as last_name,
    p.bio,
    null::text as application_status,
    null::text as verification_status,
    p.profile_visibility,
    p.show_location,
    p.show_contributions,
    p.show_status,
    case when p.show_location then p.current_country_id else null end,
    case when p.show_location then p.current_city_id else null end,
    case when p.show_status then p.hn_status else null end
  from public.profiles p
  where p.id = any(p_ids)
    and p.application_status = 'approved'
    and p.profile_visibility = true
    and p.show_contributions = true
    and (select auth.uid()) is not null;
$function$;

commit;
