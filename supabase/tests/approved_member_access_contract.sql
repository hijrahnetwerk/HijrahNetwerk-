-- Catalog-level regression checks for the approved-member access migration.
-- Run only after applying the migration in a disposable test database or approved test environment.
-- These checks do not replace the identity-by-identity RLS/RPC test matrix in the companion checklist.

do $$
declare
  v_qual text;
  v_definition text;
begin
  select qual into v_qual
  from pg_policies
  where schemaname = 'public'
    and tablename = 'blogs'
    and policyname = 'blogs_public_select'
    and cmd = 'SELECT';

  if v_qual is null or position('application_status' in v_qual) = 0
     or position('approved' in v_qual) = 0 then
    raise exception 'blogs_public_select must enforce approved-member status for member content';
  end if;

  select qual into v_qual
  from pg_policies
  where schemaname = 'public'
    and tablename = 'topic'
    and policyname = 'Members can view allowed topics'
    and cmd = 'SELECT';

  if v_qual is null or position('application_status' in v_qual) = 0
     or position('approved' in v_qual) = 0 then
    raise exception 'Members can view allowed topics must enforce approved-member status';
  end if;

  foreach v_qual in array array['hn_access_rules', 'hn_access_routes', 'hn_user_access'] loop
    if not exists (
      select 1
      from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = v_qual
        and p.cmd = 'SELECT'
        and position('application_status' in coalesce(p.qual, '')) > 0
        and position('approved' in coalesce(p.qual, '')) > 0
    ) then
      raise exception 'Table public.% must have a SELECT policy that enforces approved-member status', v_qual;
    end if;
  end loop;

  select pg_get_functiondef('public.hn_has_access(text)'::regprocedure) into v_definition;
  if position('application_status' in v_definition) = 0
     or position('approved' in v_definition) = 0 then
    raise exception 'hn_has_access(text) must enforce approved-member status before evaluating grants or badges';
  end if;

  select pg_get_functiondef('public.hn_my_access()'::regprocedure) into v_definition;
  if position('application_status' in v_definition) = 0
     or position('approved' in v_definition) = 0 then
    raise exception 'hn_my_access() must return no feature catalogue for pending/rejected accounts';
  end if;

  if has_function_privilege('anon', 'public.hn_has_access(text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.hn_my_access()', 'EXECUTE') then
    raise exception 'Anonymous users must not execute HN member-access RPCs';
  end if;

  if not has_function_privilege('authenticated', 'public.hn_has_access(text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.hn_my_access()', 'EXECUTE') then
    raise exception 'Authenticated users must retain execution rights for the HN member-access RPCs';
  end if;
end;
$$;
