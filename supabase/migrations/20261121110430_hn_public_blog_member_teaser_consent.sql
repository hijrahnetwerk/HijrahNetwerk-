create or replace function public.hn_public_blog_member_teaser(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select jsonb_build_object(
    'id', b.id,
    'title', b.title,
    'slug', b.slug,
    'type', b.type,
    'member_preview_mode', b.member_preview_mode,
    'member_preview_text', b.member_preview_text
  )
  from public.blogs as b
  where b.published = true
    and b.access_level = 'members'
    and b.slug = lower(trim(coalesce(p_slug, '')))
    and char_length(trim(coalesce(p_slug, ''))) between 1 and 180
    and (
      b.type not in ('verhaal', 'interview', 'ervaring')
      or b.consent_confirmed = true
    )
  limit 1;
$function$;

revoke all on function public.hn_public_blog_member_teaser(text) from public;
grant execute on function public.hn_public_blog_member_teaser(text) to anon, authenticated;
