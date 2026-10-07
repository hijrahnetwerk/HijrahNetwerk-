-- Keep the public admin RPC SECURITY INVOKER so the API does not expose
-- a SECURITY DEFINER function to signed-in users. The privileged write
-- remains inside private.award_badge().
create or replace function public.award_hn_badge(
  p_user_id uuid,
  p_badge_slug text,
  p_source text default 'manual'
)
returns boolean
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  if (select auth.uid()) is null or not (select private.is_admin()) then
    return false;
  end if;

  return private.award_badge(p_user_id, p_badge_slug, p_source);
end
$function$;

revoke execute on function public.award_hn_badge(uuid,text,text) from public;
grant execute on function public.award_hn_badge(uuid,text,text) to authenticated;
