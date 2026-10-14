create or replace function public.hn_admin_save_badge(
  p_badge_id uuid,
  p_slug text,
  p_name text,
  p_category text,
  p_icon text,
  p_trigger_key text,
  p_threshold integer,
  p_description text,
  p_manual_only boolean,
  p_show_on_profile boolean,
  p_active boolean,
  p_sort_order integer
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_slug text:=lower(trim(coalesce(p_slug,'')));
begin
  if not (select private.is_admin()) then raise exception 'Alleen HN-beheerders.' using errcode='42501'; end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(trim(coalesce(p_name,'')))<2 then
    raise exception 'Vul een geldige slug en naam in.' using errcode='22023';
  end if;
  if p_threshold is null or p_threshold<1 then raise exception 'De drempel moet minimaal 1 zijn.' using errcode='22023'; end if;
  if p_badge_id is null then
    insert into public.hn_badges(slug,name,category,icon,trigger_key,threshold,description,manual_only,show_on_profile,active,sort_order,updated_at)
    values(v_slug,trim(p_name),coalesce(nullif(trim(coalesce(p_category,'')),''),'mijlpaal'),coalesce(nullif(trim(coalesce(p_icon,'')),''),'✦'),nullif(trim(coalesce(p_trigger_key,'')),''),p_threshold,nullif(trim(coalesce(p_description,'')),''),coalesce(p_manual_only,false),coalesce(p_show_on_profile,true),coalesce(p_active,true),coalesce(p_sort_order,0),now())
    returning id into v_id;
  else
    update public.hn_badges set slug=v_slug,name=trim(p_name),category=coalesce(nullif(trim(coalesce(p_category,'')),''),'mijlpaal'),icon=coalesce(nullif(trim(coalesce(p_icon,'')),''),'✦'),trigger_key=nullif(trim(coalesce(p_trigger_key,'')),''),threshold=p_threshold,description=nullif(trim(coalesce(p_description,'')),''),manual_only=coalesce(p_manual_only,false),show_on_profile=coalesce(p_show_on_profile,true),active=coalesce(p_active,true),sort_order=coalesce(p_sort_order,0),updated_at=now()
    where id=p_badge_id returning id into v_id;
    if v_id is null then raise exception 'Stempel niet gevonden.' using errcode='P0002'; end if;
  end if;
  return v_id;
end;
$$;
revoke all on function public.hn_admin_save_badge(uuid,text,text,text,text,text,integer,text,boolean,boolean,boolean,integer) from public,anon;
grant execute on function public.hn_admin_save_badge(uuid,text,text,text,text,text,integer,text,boolean,boolean,boolean,integer) to authenticated;

create or replace function public.hn_admin_save_status(
  p_status_id uuid,
  p_slug text,
  p_name text,
  p_icon text,
  p_description text,
  p_sort_order integer,
  p_show_on_profile boolean,
  p_active boolean
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_slug text:=lower(trim(coalesce(p_slug,'')));
begin
  if not (select private.is_admin()) then raise exception 'Alleen HN-beheerders.' using errcode='42501'; end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(trim(coalesce(p_name,'')))<2 then
    raise exception 'Vul een geldige slug en naam in.' using errcode='22023';
  end if;
  if p_status_id is null then
    insert into public.hn_statuses(slug,name,icon,description,sort_order,show_on_profile,active,updated_at)
    values(v_slug,trim(p_name),coalesce(nullif(trim(coalesce(p_icon,'')),''),'•'),nullif(trim(coalesce(p_description,'')),''),coalesce(p_sort_order,0),coalesce(p_show_on_profile,true),coalesce(p_active,true),now())
    returning id into v_id;
  else
    update public.hn_statuses set slug=v_slug,name=trim(p_name),icon=coalesce(nullif(trim(coalesce(p_icon,'')),''),'•'),description=nullif(trim(coalesce(p_description,'')),''),sort_order=coalesce(p_sort_order,0),show_on_profile=coalesce(p_show_on_profile,true),active=coalesce(p_active,true),updated_at=now()
    where id=p_status_id returning id into v_id;
    if v_id is null then raise exception 'HN-status niet gevonden.' using errcode='P0002'; end if;
  end if;
  return v_id;
end;
$$;
revoke all on function public.hn_admin_save_status(uuid,text,text,text,text,integer,boolean,boolean) from public,anon;
grant execute on function public.hn_admin_save_status(uuid,text,text,text,text,integer,boolean,boolean) to authenticated;
