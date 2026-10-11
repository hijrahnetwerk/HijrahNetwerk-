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

  insert into public.hn_admin_audit_log(admin_id, action, entity_type, entity_id, details)
  values ((select auth.uid()), 'badge_deleted', 'hn_badges', p_badge_id,
          jsonb_build_object('name', v_name));

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

  insert into public.hn_admin_audit_log(admin_id, action, entity_type, entity_id, details)
  values ((select auth.uid()), 'badges_reordered', 'hn_badges', null,
          jsonb_build_object('count', v_count));

  return true;
end;
$function$;

revoke all on function public.hn_admin_delete_badge(uuid) from public, anon;
revoke all on function public.hn_admin_reorder_badges(jsonb) from public, anon;
grant execute on function public.hn_admin_delete_badge(uuid) to authenticated;
grant execute on function public.hn_admin_reorder_badges(jsonb) to authenticated;

commit;
