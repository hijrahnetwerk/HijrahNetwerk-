-- Apply only when the HN Paspoort release is approved for production.
-- Hijrah Navigatie content is protected by the existing database-backed access rule.
-- Public/anon access to topic rows is removed; published navigation content is available
-- only to users whose HN access rule is satisfied, including administrators.
drop policy if exists "Anonymous can view public topics" on public.topic;
drop policy if exists "Members can view allowed topics" on public.topic;
drop policy if exists "HN Navigatie access required" on public.topic;
create policy "HN Navigatie access required"
on public.topic
for select
to authenticated
using ((select public.hn_has_access('hijrah_navigatie')));
