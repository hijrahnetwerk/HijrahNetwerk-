-- Enforce manual approval at the database layer for member-only content and HN feature access.
-- Public launch pages and public content remain public. Admin access remains explicit.
begin;

-- Articles/blogs: "members" means approved HN members, not any signed-in account.
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
      and (select auth.uid()) is not null
      and exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.application_status = 'approved'
      )
    )
    or (
      access_level = 'moderators'
      and (select private.is_admin())
    )
  )
);

-- Topic/fiches: keep explicitly public records public; restrict member-only records.
drop policy if exists "Members can view allowed topics" on public.topic;
create policy "Members can view allowed topics"
on public.topic
for select
to authenticated
using (
  (
    published = true
    and coalesce(visibility, '') = any(array['', 'public', 'fiche_only'])
  )
  or (
    published = true
    and visibility in ('members', 'approved_members')
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.application_status = 'approved'
    )
  )
  or (select private.is_admin())
);

-- Do not disclose feature-access configuration or a user's grants to pending members.
drop policy if exists "Members read active access rules" on public.hn_access_rules;
create policy "Members read active access rules"
on public.hn_access_rules
for select
to authenticated
using (
  (active = true and (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.application_status = 'approved'
    )
  ))
  or (select private.is_admin())
);

drop policy if exists "Members read active access routes" on public.hn_access_routes;
create policy "Members read active access routes"
on public.hn_access_routes
for select
to authenticated
using (
  (active = true and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.application_status = 'approved'
  ))
  or (select private.is_admin())
);

drop policy if exists "Members read own access" on public.hn_user_access;
create policy "Members read own access"
on public.hn_user_access
for select
to authenticated
using (
  (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.application_status = 'approved'
    )
  )
  or (select private.is_admin())
);

-- Central access check used by the frontend and other database functions.
-- Admins are allowed explicitly; all other users must be approved before
-- an individual grant or badge route can unlock a feature.
create or replace function public.hn_has_access(p_feature_key text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select
    coalesce((select private.is_admin()), false)
    or (
      exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.application_status = 'approved'
      )
      and (
        exists (
          select 1
          from public.hn_user_access ua
          where ua.user_id = (select auth.uid())
            and ua.feature_key = p_feature_key
        )
        or exists (
          select 1
          from public.hn_access_rules r
          join public.hn_access_routes ro
            on ro.rule_id = r.id
           and ro.active
           and ro.route_type = 'badge'
          join public.hn_user_badges ub
            on ub.badge_id = ro.badge_id
           and ub.user_id = (select auth.uid())
          where r.feature_key = p_feature_key
            and r.active
        )
      )
    );
$function$;

-- A pending/rejected member receives no feature catalogue from this RPC.
create or replace function public.hn_my_access()
returns table(feature_key text, name text, description text, unlocked boolean, routes jsonb)
language sql
stable
security definer
set search_path to ''
as $function$
  select
    r.feature_key,
    r.name,
    r.description,
    public.hn_has_access(r.feature_key),
    coalesce((
      select jsonb_agg(
        jsonb_build_object('label', ro.label, 'type', ro.route_type, 'badge', b.name)
        order by ro.sort_order
      )
      from public.hn_access_routes ro
      left join public.hn_badges b on b.id = ro.badge_id
      where ro.rule_id = r.id and ro.active
    ), '[]'::jsonb)
  from public.hn_access_rules r
  where r.active
    and (select auth.uid()) is not null
    and (
      (select private.is_admin())
      or exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.application_status = 'approved'
      )
    )
  order by r.name;
$function$;

revoke all on function public.hn_has_access(text) from public, anon;
grant execute on function public.hn_has_access(text) to authenticated;
revoke all on function public.hn_my_access() from public, anon;
grant execute on function public.hn_my_access() to authenticated;

commit;
