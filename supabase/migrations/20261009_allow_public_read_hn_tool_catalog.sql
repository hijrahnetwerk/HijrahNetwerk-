-- The public page needs to read is_active=false rows so it can hide tools
-- that an administrator has disabled. Catalog metadata is not private.
drop policy if exists "Public can read active HN tools" on public.hn_tool_catalog;
create policy "Public can read HN tools"
  on public.hn_tool_catalog
  for select
  to anon, authenticated
  using (true);
