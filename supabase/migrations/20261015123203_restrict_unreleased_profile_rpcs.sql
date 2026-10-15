-- Keep profile RPCs unavailable until the opt-in public-profile UI is ready and tested.
-- The current website does not use these endpoints; public profile access should not
-- be enabled by default for newly created accounts.
REVOKE EXECUTE ON FUNCTION public.hn_public_profile(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.hn_public_profiles() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.hn_public_profiles(uuid[]) FROM authenticated;

-- Badge awards are performed through the admin-only hn_admin_set_badge endpoint.
-- Keep the lower-level award helper inaccessible as a separate RPC.
REVOKE EXECUTE ON FUNCTION public.award_hn_badge(uuid, text, text) FROM authenticated;
