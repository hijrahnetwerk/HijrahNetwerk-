-- Admin RPCs for managing passport text and access routes without direct table writes.
create or replace function public.hn_admin_save_badge_details(
  p_badge_id uuid,
  p_meaning_text text,
  p_condition_text text,
  p_unlock_text text
) returns boolean
language plpgsql security definer set search_path=''
as $$
begin
  if not (select private.is_admin()) then raise exception 'Alleen HN-beheerders.' using errcode='42501'; end if;
  update public.hn_badges
  set meaning_text=nullif(trim(coalesce(p_meaning_text,'')),''),
      condition_text=nullif(trim(coalesce(p_condition_text,'')),''),
      unlock_text=nullif(trim(coalesce(p_unlock_text,'')),''),
      updated_at=now()
  where id=p_badge_id;
  if not found then raise exception 'Stempel niet gevonden.' using errcode='P0002'; end if;
  return true;
end;
$$;
revoke all on function public.hn_admin_save_badge_details(uuid,text,text,text) from public,anon;
grant execute on function public.hn_admin_save_badge_details(uuid,text,text,text) to authenticated;

create or replace function public.hn_admin_save_access_rule(
  p_feature_key text,
  p_name text,
  p_description text,
  p_active boolean
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_key text:=lower(trim(coalesce(p_feature_key,'')));
begin
  if not (select private.is_admin()) then raise exception 'Alleen HN-beheerders.' using errcode='42501'; end if;
  if v_key !~ '^[a-z0-9_]{3,80}$' or length(trim(coalesce(p_name,'')))<2 then
    raise exception 'Vul een geldige sleutel en naam in.' using errcode='22023';
  end if;
  insert into public.hn_access_rules(feature_key,name,description,active,updated_at)
  values(v_key,trim(p_name),nullif(trim(coalesce(p_description,'')),''),coalesce(p_active,true),now())
  on conflict(feature_key) do update set name=excluded.name,description=excluded.description,active=excluded.active,updated_at=now()
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.hn_admin_save_access_rule(text,text,text,boolean) from public,anon;
grant execute on function public.hn_admin_save_access_rule(text,text,text,boolean) to authenticated;

create or replace function public.hn_admin_save_access_route(
  p_feature_key text,
  p_route_id uuid,
  p_route_type text,
  p_badge_slug text,
  p_label text,
  p_active boolean,
  p_sort_order integer
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_rule uuid; v_badge uuid; v_id uuid;
begin
  if not (select private.is_admin()) then raise exception 'Alleen HN-beheerders.' using errcode='42501'; end if;
  if p_route_type not in ('badge','manual') or length(trim(coalesce(p_label,'')))<2 then
    raise exception 'Vul een geldig type en label in.' using errcode='22023';
  end if;
  select id into v_rule from public.hn_access_rules where feature_key=lower(trim(coalesce(p_feature_key,'')));
  if v_rule is null then raise exception 'Toegangsregel niet gevonden.' using errcode='P0002'; end if;
  if p_route_type='badge' then
    select id into v_badge from public.hn_badges where slug=trim(coalesce(p_badge_slug,''));
    if v_badge is null then raise exception 'Kies een bestaande stempel.' using errcode='22023'; end if;
  end if;
  if p_route_id is null then
    insert into public.hn_access_routes(rule_id,route_type,badge_id,label,active,sort_order)
    values(v_rule,p_route_type,v_badge,trim(p_label),coalesce(p_active,true),coalesce(p_sort_order,0))
    returning id into v_id;
  else
    update public.hn_access_routes
    set route_type=p_route_type,badge_id=v_badge,label=trim(p_label),active=coalesce(p_active,true),sort_order=coalesce(p_sort_order,0)
    where id=p_route_id and rule_id=v_rule
    returning id into v_id;
    if v_id is null then raise exception 'Toegangsroute niet gevonden.' using errcode='P0002'; end if;
  end if;
  return v_id;
end;
$$;
revoke all on function public.hn_admin_save_access_route(text,uuid,text,text,text,boolean,integer) from public,anon;
grant execute on function public.hn_admin_save_access_route(text,uuid,text,text,text,boolean,integer) to authenticated;

create or replace function public.hn_admin_delete_access_route(p_route_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
  if not (select private.is_admin()) then raise exception 'Alleen HN-beheerders.' using errcode='42501'; end if;
  delete from public.hn_access_routes where id=p_route_id;
  if not found then raise exception 'Toegangsroute niet gevonden.' using errcode='P0002'; end if;
  return true;
end;
$$;
revoke all on function public.hn_admin_delete_access_route(uuid) from public,anon;
grant execute on function public.hn_admin_delete_access_route(uuid) to authenticated;
