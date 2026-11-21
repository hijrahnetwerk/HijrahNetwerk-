create or replace function public.hn_public_blog_member_teasers()
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'title', b.title,
        'slug', b.slug,
        'type', b.type,
        'member_preview_mode', b.member_preview_mode,
        'member_preview_text',
          case when b.member_preview_mode = 'teaser'
            then coalesce(b.member_preview_text, '')
            else ''
          end,
        'published_at', b.published_at
      )
      order by b.published_at desc nulls last
    ),
    '[]'::jsonb
  )
  from public.blogs as b
  where b.published = true
    and b.access_level = 'members'
    and (
      b.type not in ('verhaal', 'interview', 'ervaring')
      or b.consent_confirmed = true
    );
$function$;

revoke all on function public.hn_public_blog_member_teasers() from public;
grant execute on function public.hn_public_blog_member_teasers() to anon, authenticated;
