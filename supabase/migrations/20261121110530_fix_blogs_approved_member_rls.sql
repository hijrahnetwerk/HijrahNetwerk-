create or replace function private.is_approved_member()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and application_status = 'approved'
  );
$function$;

revoke all on function private.is_approved_member() from public;
grant execute on function private.is_approved_member() to anon, authenticated;

drop policy if exists blogs_public_select on public.blogs;

create policy blogs_public_select
on public.blogs
for select
to anon, authenticated
using (
  published = true
  and (
    access_level = 'public'
    or (
      access_level = 'members'
      and (select private.is_approved_member())
    )
    or (
      access_level = 'moderators'
      and (select private.is_admin())
    )
  )
);
