-- After the updated admin UI is deployed, require audited RPCs for all passport writes.
-- Keep SELECT policies intact; only remove direct table-write paths.
drop policy if exists "Admins delete HN badges" on public.hn_badges;
drop policy if exists "Admins insert HN badges" on public.hn_badges;
drop policy if exists "Admins update HN badges" on public.hn_badges;

drop policy if exists "Admins delete HN statuses" on public.hn_statuses;
drop policy if exists "Admins insert HN statuses" on public.hn_statuses;
drop policy if exists "Admins update HN statuses" on public.hn_statuses;

drop policy if exists "Admins write access rules" on public.hn_access_rules;
drop policy if exists "Admins write access routes" on public.hn_access_routes;
drop policy if exists "Admins write user access" on public.hn_user_access;

drop policy if exists "Admins delete HN user badges" on public.hn_user_badges;
drop policy if exists "Admins insert HN user badges" on public.hn_user_badges;
drop policy if exists "Admins update HN user badges" on public.hn_user_badges;
