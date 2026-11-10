-- Keep profile updates available only for fields members may edit themselves.
-- Administrative fields are managed through HN's guarded SECURITY DEFINER RPCs.
grant update (
  first_name,
  last_name,
  whatsapp_number,
  current_country_id,
  current_city_id,
  display_name,
  bio,
  profile_visibility,
  show_location,
  show_contributions,
  show_status,
  show_badges
) on table public.profiles to authenticated;
