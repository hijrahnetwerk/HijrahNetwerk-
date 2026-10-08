-- Harden admin RPCs: these functions already enforce admin authorization internally
-- and all underlying tables have matching admin RLS policies. SECURITY INVOKER
-- removes unnecessary RLS bypass while preserving the admin-only behavior.
alter function public.hn_admin_profiles() security invoker;
alter function public.hn_admin_save_page(uuid, jsonb, jsonb, boolean) security invoker;
