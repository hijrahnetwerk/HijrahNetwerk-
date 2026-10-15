-- Catalog-level regression checks for the approved-member access migration.
-- Run only after applying the migration in a disposable, non-production Supabase environment.
-- These checks verify catalog state; they do not replace behavioral tests with real identities.

do $$
declare
  v_policy text;
  v_qual text;
  v_definition text;
  v_table text;
begin
  -- Expected member-content policies must explicitly gate the member path on approval.
  select qual into v_qual
  from pg_policies
  where schemaname = 'public' and tablename = 'blogs'
    and policyname = 'blogs_public_select' and cmd = 'SELECT';

  if v_qual is null
     or position('application_status' in v_qual) = 0
     or position('approved' in v_qual) = 0
     or position('access_level' in v_qual) = 0 then
    raise exception 'blogs_public_select is missing its approved-member gate';
  end if;

  select qual into v_qual
  from pg_policies
  where schemaname = 'public' and tablename = 'topic'
    and policyname = 'Members can view allowed topics' and cmd = 'SELECT';

  if v_qual is null
     or position('application_status' in v_qual) = 0
     or position('approved' in v_qual) = 0
     or position('approved_members' in v_qual) = 0 then
    raise exception 'Members can view allowed topics is missing its approved-member gate';
  end if;

  -- Reject the legacy direct members branch even if a separate approved_members
  -- branch in the same policy mentions application_status.
  if position('visibility = ''members''::text' in v_qual) > 0 then
    raise exception 'Members can view allowed topics still has an unguarded visibility = members branch';
  end if;

  -- RLS permissive policies are OR-combined. Include policies granted to PUBLIC,
  -- since those apply to authenticated users too. Public-only content policies
  -- are allowed, but they must not expose rows explicitly marked members-only.
  foreach v_table in array array['blogs', 'topic', 'hn_access_rules', 'hn_access_routes', 'hn_user_access'] loop
    for v_policy, v_qual in
      select p.policyname, coalesce(p.qual, '')
      from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = v_table
        and p.cmd in ('SELECT', 'ALL')
        and (
          'authenticated' = any(p.roles)
          or 'public' = any(p.roles)
        )
        and p.permissive = 'PERMISSIVE'
    loop
      if v_table = 'blogs' then
        if position('access_level' in v_qual) > 0
           and position('members' in v_qual) > 0
           and (
             position('application_status' in v_qual) = 0
             or position('approved' in v_qual) = 0
           )
           and position('private.is_admin' in v_qual) = 0 then
          raise exception 'Potential RLS bypass: public.blogs policy "%" exposes members-only content without approval/admin gate',
            v_policy;
        end if;
      elsif v_table = 'topic' then
        if position('visibility' in v_qual) > 0
           and position('members' in v_qual) > 0
           and (
             position('application_status' in v_qual) = 0
             or position('approved' in v_qual) = 0
           )
           and position('private.is_admin' in v_qual) = 0 then
          raise exception 'Potential RLS bypass: public.topic policy "%" exposes member-only fiches without approval/admin gate',
            v_policy;
        end if;
      else
        if (
          position('application_status' in v_qual) = 0
          or position('approved' in v_qual) = 0
        ) and (
          position('private.is_admin' in v_qual) = 0
          or position('active' in v_qual) > 0
          or position('user_id' in v_qual) > 0
          or position('access_level' in v_qual) > 0
          or position('visibility' in v_qual) > 0
        ) then
          raise exception 'Potential RLS bypass: public.%, policy "%" lacks an approval gate (or is not admin-only)',
            v_table, v_policy;
        end if;
      end if;
    end loop;
  end loop;

  -- The active access configuration and personal grants must have approved-member
  -- SELECT policies, with separate admin bypasses allowed.
  foreach v_table in array array['hn_access_rules', 'hn_access_routes', 'hn_user_access'] loop
    if not exists (
      select 1 from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = v_table
        and p.cmd = 'SELECT'
        and 'authenticated' = any(p.roles)
        and position('application_status' in coalesce(p.qual, '')) > 0
        and position('approved' in coalesce(p.qual, '')) > 0
    ) then
      raise exception 'Table public.% lacks an approved-member SELECT policy', v_table;
    end if;
  end loop;

  select pg_get_functiondef('public.hn_has_access(text)'::regprocedure) into v_definition;
  if v_definition is null
     or position('application_status' in v_definition) = 0
     or position('approved' in v_definition) = 0 then
    raise exception 'hn_has_access(text) must gate individual grants and badge routes on approval';
  end if;

  select pg_get_functiondef('public.hn_my_access()'::regprocedure) into v_definition;
  if v_definition is null
     or position('application_status' in v_definition) = 0
     or position('approved' in v_definition) = 0 then
    raise exception 'hn_my_access() must return no catalogue to pending/rejected accounts';
  end if;

  if has_function_privilege('anon', 'public.hn_has_access(text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.hn_my_access()', 'EXECUTE') then
    raise exception 'Anonymous users must not execute HN member-access RPCs';
  end if;

  if not has_function_privilege('authenticated', 'public.hn_has_access(text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.hn_my_access()', 'EXECUTE') then
    raise exception 'Authenticated users must retain execution rights for HN member-access RPCs';
  end if;
end;
$$;
