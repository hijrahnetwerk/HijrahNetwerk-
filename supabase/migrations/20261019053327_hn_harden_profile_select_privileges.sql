begin;

-- Restore least-privilege profile access. In particular, admin_notes must
-- never be selectable by ordinary authenticated members through PostgREST.
revoke select on public.profiles from anon, authenticated;
revoke insert on public.profiles from anon, authenticated;

grant select (
  id, role, application_status, verification_status, display_name, first_name,
  last_name, bio, profile_visibility, show_location, show_contributions,
  show_status, current_country_id, current_city_id, hn_status
) on public.profiles to authenticated;

commit;
