-- Restore missing admin table privileges while keeping authorization enforced by RLS.
-- Profile writes are intentionally handled by a SECURITY DEFINER RPC, not table-wide UPDATE grants.

grant insert, update, delete on table public.countries, public.cities, public.subcategories, public.topic to authenticated;

grant select on table public.hn_content_overrides, public.hn_page_layout_overrides to anon, authenticated;

grant select, insert, update, delete on table public.reviewer_topic, public.hn_badges, public.hn_user_badges, public.hn_site_blocks to authenticated;

create or replace function public.hn_admin_update_profile(p_profile_id uuid, p_payload jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not private.is_admin() then
    raise exception 'Alleen HN-beheerders mogen profielen wijzigen.' using errcode = '42501';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Ongeldige profielgegevens.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(p_payload) as k(key)
    where k.key <> all (array[
      'display_name','bio','hn_status','application_status','verification_status',
      'role','profile_visibility','show_location','show_contributions','show_status',
      'approved_at','updated_at'
    ])
  ) then
    raise exception 'Onbekend profielveld in verzoek.' using errcode = '22023';
  end if;

  update public.profiles
  set
    display_name = case when p_payload ? 'display_name' then nullif(p_payload->>'display_name','') else display_name end,
    bio = case when p_payload ? 'bio' then nullif(p_payload->>'bio','') else bio end,
    hn_status = case when p_payload ? 'hn_status' then p_payload->>'hn_status' else hn_status end,
    application_status = case when p_payload ? 'application_status' then p_payload->>'application_status' else application_status end,
    verification_status = case when p_payload ? 'verification_status' then p_payload->>'verification_status' else verification_status end,
    role = case when p_payload ? 'role' then p_payload->>'role' else role end,
    profile_visibility = case when p_payload ? 'profile_visibility' then (p_payload->>'profile_visibility')::boolean else profile_visibility end,
    show_location = case when p_payload ? 'show_location' then (p_payload->>'show_location')::boolean else show_location end,
    show_contributions = case when p_payload ? 'show_contributions' then (p_payload->>'show_contributions')::boolean else show_contributions end,
    show_status = case when p_payload ? 'show_status' then (p_payload->>'show_status')::boolean else show_status end,
    approved_at = case when p_payload ? 'approved_at' then nullif(p_payload->>'approved_at','')::timestamptz else approved_at end,
    updated_at = case when p_payload ? 'updated_at' then (p_payload->>'updated_at')::timestamptz else now() end
  where id = p_profile_id;

  if not found then
    raise exception 'Profiel niet gevonden.' using errcode = 'P0002';
  end if;

  return true;
end;
$function$;

revoke all on function public.hn_admin_update_profile(uuid, jsonb) from public, anon;
grant execute on function public.hn_admin_update_profile(uuid, jsonb) to authenticated;
