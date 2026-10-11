-- Site-wide, reversible reset for layout-only visual overrides.
create table if not exists public.hn_layout_reset_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  restored_at timestamptz
);
alter table public.hn_layout_reset_snapshots enable row level security;
drop policy if exists "HN layout reset snapshots admin only" on public.hn_layout_reset_snapshots;
create policy "HN layout reset snapshots admin only"
  on public.hn_layout_reset_snapshots for all to authenticated
  using ((select is_admin())) with check ((select is_admin()));
grant select, insert, update, delete on public.hn_layout_reset_snapshots to authenticated;

create or replace function public.hn_admin_reset_all_layout_overrides()
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
  v_snapshot_id uuid;
begin
  if auth.uid() is null or not coalesce(public.is_admin(), false) then
    raise exception 'Alleen een beheerder kan de opmaak herstellen.';
  end if;
  select count(*) into v_count from public.hn_page_layout_overrides;
  if v_count > 0 then
    insert into public.hn_layout_reset_snapshots(snapshot, created_by)
    select coalesce(jsonb_agg(to_jsonb(x) order by x.route, x.sort_order, x.selector), '[]'::jsonb), auth.uid()
    from public.hn_page_layout_overrides x
    returning id into v_snapshot_id;
    delete from public.hn_page_layout_overrides;
  end if;
  return jsonb_build_object('reset_count', v_count, 'snapshot_id', v_snapshot_id);
end;
$$;

create or replace function public.hn_admin_restore_previous_layout()
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_previous public.hn_layout_reset_snapshots%rowtype;
  v_current jsonb;
  v_current_count integer;
  v_restored_count integer := 0;
  v_item jsonb;
begin
  if auth.uid() is null or not coalesce(public.is_admin(), false) then
    raise exception 'Alleen een beheerder kan de opmaak herstellen.';
  end if;
  select * into v_previous
  from public.hn_layout_reset_snapshots
  where restored_at is null
  order by created_at desc
  limit 1
  for update;
  if not found then
    return jsonb_build_object('restored_count', 0, 'message', 'Geen vorige opmaak beschikbaar.');
  end if;
  select count(*) into v_current_count from public.hn_page_layout_overrides;
  if v_current_count > 0 then
    select coalesce(jsonb_agg(to_jsonb(x) order by x.route, x.sort_order, x.selector), '[]'::jsonb)
      into v_current from public.hn_page_layout_overrides x;
    insert into public.hn_layout_reset_snapshots(snapshot, created_by)
    values (v_current, auth.uid());
  end if;
  delete from public.hn_page_layout_overrides;
  for v_item in select value from jsonb_array_elements(coalesce(v_previous.snapshot, '[]'::jsonb))
  loop
    insert into public.hn_page_layout_overrides
      (id, route, selector, sort_order, is_visible, settings, updated_by, created_at, updated_at)
    values
      ((v_item->>'id')::uuid,
       v_item->>'route',
       v_item->>'selector',
       coalesce((v_item->>'sort_order')::integer, 0),
       coalesce((v_item->>'is_visible')::boolean, true),
       coalesce(v_item->'settings', '{}'::jsonb),
       nullif(v_item->>'updated_by','')::uuid,
       coalesce((v_item->>'created_at')::timestamptz, now()),
       coalesce((v_item->>'updated_at')::timestamptz, now()));
    v_restored_count := v_restored_count + 1;
  end loop;
  update public.hn_layout_reset_snapshots set restored_at = now() where id = v_previous.id;
  return jsonb_build_object('restored_count', v_restored_count, 'snapshot_id', v_previous.id);
end;
$$;

revoke all on function public.hn_admin_reset_all_layout_overrides() from public, anon;
revoke all on function public.hn_admin_restore_previous_layout() from public, anon;
grant execute on function public.hn_admin_reset_all_layout_overrides() to authenticated;
grant execute on function public.hn_admin_restore_previous_layout() to authenticated;
