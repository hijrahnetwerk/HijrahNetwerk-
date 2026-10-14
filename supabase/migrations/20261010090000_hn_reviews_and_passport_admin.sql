-- HN reviews: private author identity, public neutral labels, moderation and reports.
create sequence if not exists public.hn_review_public_label_seq;

create table if not exists public.hn_reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  public_label text not null unique default ('Lid ' || nextval('public.hn_review_public_label_seq'::regclass)),
  target_key text not null,
  target_name text not null,
  country_name text,
  city_name text,
  category_name text,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 30 and 4000),
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  report_count integer not null default 0 check (report_count >= 0),
  constraint hn_reviews_one_per_author_target unique (author_id, target_key)
);
create index if not exists hn_reviews_public_target_idx on public.hn_reviews(target_key, status, created_at desc);
create index if not exists hn_reviews_author_idx on public.hn_reviews(author_id, created_at desc);
alter table public.hn_reviews enable row level security;
revoke all on public.hn_reviews from anon, authenticated;
revoke all on sequence public.hn_review_public_label_seq from anon, authenticated;

create table if not exists public.hn_review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.hn_reviews(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending','reviewed','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  constraint hn_review_reports_one_per_user unique (review_id, reporter_id)
);
create index if not exists hn_review_reports_status_idx on public.hn_review_reports(status, created_at desc);
alter table public.hn_review_reports enable row level security;
revoke all on public.hn_review_reports from anon, authenticated;

create or replace function public.hn_submit_review(
  p_target_key text,
  p_target_name text,
  p_country_name text,
  p_city_name text,
  p_category_name text,
  p_rating integer,
  p_body text
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_key text := lower(trim(coalesce(p_target_key,'')));
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Log in om een review in te dienen.' using errcode='42501';
  end if;
  if length(v_key) < 3 or length(v_key) > 200
     or length(trim(coalesce(p_target_name,''))) < 2
     or length(trim(coalesce(p_target_name,''))) > 200 then
    raise exception 'Vul een geldige naam en bestemming voor de review in.' using errcode='22023';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Kies een waardering van 1 tot en met 5.' using errcode='22023';
  end if;
  if length(trim(coalesce(p_body,''))) < 30 or length(trim(coalesce(p_body,''))) > 4000 then
    raise exception 'Een review moet tussen 30 en 4000 tekens bevatten.' using errcode='22023';
  end if;
  if (select count(*) from public.hn_reviews r where r.author_id=v_user and r.created_at > now()-interval '24 hours') >= 5 then
    raise exception 'Je hebt de maximale hoeveelheid reviews voor vandaag bereikt.' using errcode='42900';
  end if;
  insert into public.hn_reviews(author_id,target_key,target_name,country_name,city_name,category_name,rating,body)
  values(v_user,v_key,trim(p_target_name),nullif(trim(coalesce(p_country_name,'')),''),nullif(trim(coalesce(p_city_name,'')),''),nullif(trim(coalesce(p_category_name,'')),''),p_rating,trim(p_body))
  returning id into v_id;
  return v_id;
exception
  when unique_violation then
    raise exception 'Je hebt voor deze bestemming al een review ingediend.' using errcode='23505';
end;
$$;
revoke all on function public.hn_submit_review(text,text,text,text,text,integer,text) from public, anon;
grant execute on function public.hn_submit_review(text,text,text,text,text,integer,text) to authenticated;

create or replace function public.hn_public_reviews(p_target_key text default null)
returns table(id uuid, public_label text, target_key text, target_name text, country_name text, city_name text, category_name text, rating smallint, body text, created_at timestamptz)
language sql stable security definer set search_path=''
as $$
  select r.id,r.public_label,r.target_key,r.target_name,r.country_name,r.city_name,r.category_name,r.rating,r.body,r.created_at
  from public.hn_reviews r
  where r.status='published'
    and (p_target_key is null or r.target_key=lower(trim(p_target_key)))
  order by r.created_at desc
  limit 200;
$$;
revoke all on function public.hn_public_reviews(text) from public;
grant execute on function public.hn_public_reviews(text) to anon, authenticated;

create or replace function public.hn_admin_reviews(p_status text default null)
returns table(id uuid, author_id uuid, author_name text, author_email text, public_label text, target_key text, target_name text, country_name text, city_name text, category_name text, rating smallint, body text, status text, report_count integer, created_at timestamptz, moderated_at timestamptz)
language plpgsql stable security definer set search_path=''
as $$
begin
  if not (select private.is_admin()) then raise exception 'Alleen HN-beheerders.' using errcode='42501'; end if;
  return query
  select r.id,r.author_id,coalesce(nullif(p.display_name,''),nullif(p.first_name,''),'Lid')::text,
         p.email::text,r.public_label,r.target_key,r.target_name,r.country_name,r.city_name,r.category_name,r.rating,r.body,r.status,r.report_count,r.created_at,r.moderated_at
  from public.hn_reviews r left join public.profiles p on p.id=r.author_id
  where p_status is null or r.status=p_status
  order by r.created_at desc limit 500;
end;
$$;
revoke all on function public.hn_admin_reviews(text) from public, anon;
grant execute on function public.hn_admin_reviews(text) to authenticated;

create or replace function public.hn_moderate_review(p_review_id uuid, p_status text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_author uuid;
begin
  if not (select private.is_admin()) then raise exception 'Alleen HN-beheerders.' using errcode='42501'; end if;
  if p_status not in ('pending','published','rejected') then raise exception 'Ongeldige reviewstatus.' using errcode='22023'; end if;
  update public.hn_reviews set status=p_status,moderated_by=(select auth.uid()),moderated_at=now(),updated_at=now()
  where id=p_review_id returning author_id into v_author;
  if not found then raise exception 'Review niet gevonden.' using errcode='P0002'; end if;
  insert into public.hn_admin_audit_log(admin_id,action,entity_type,entity_id,details)
  values((select auth.uid()),'review_moderated','hn_review',p_review_id,jsonb_build_object('status',p_status,'author_id',v_author));
  return true;
end;
$$;
revoke all on function public.hn_moderate_review(uuid,text) from public, anon;
grant execute on function public.hn_moderate_review(uuid,text) to authenticated;

create or replace function public.hn_report_review(p_review_id uuid, p_reason text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'Log in om een review te melden.' using errcode='42501'; end if;
  if length(trim(coalesce(p_reason,''))) < 10 or length(trim(coalesce(p_reason,''))) > 1000 then
    raise exception 'Beschrijf de reden van de melding in 10 tot 1000 tekens.' using errcode='22023';
  end if;
  if not exists(select 1 from public.hn_reviews where id=p_review_id and status='published') then
    raise exception 'Deze review is niet beschikbaar.' using errcode='P0002';
  end if;
  insert into public.hn_review_reports(review_id,reporter_id,reason) values(p_review_id,v_user,trim(p_reason));
  update public.hn_reviews set report_count=report_count+1 where id=p_review_id;
  return true;
exception when unique_violation then
  raise exception 'Je hebt deze review al gemeld.' using errcode='23505';
end;
$$;
revoke all on function public.hn_report_review(uuid,text) from public, anon;
grant execute on function public.hn_report_review(uuid,text) to authenticated;

create or replace function public.hn_admin_review_reports(p_status text default 'pending')
returns table(id uuid, review_id uuid, reporter_id uuid, reason text, status text, created_at timestamptz, target_name text, public_label text)
language plpgsql stable security definer set search_path=''
as $$
begin
  if not (select private.is_admin()) then raise exception 'Alleen HN-beheerders.' using errcode='42501'; end if;
  return query
  select rr.id,rr.review_id,rr.reporter_id,rr.reason,rr.status,rr.created_at,r.target_name,r.public_label
  from public.hn_review_reports rr join public.hn_reviews r on r.id=rr.review_id
  where p_status is null or rr.status=p_status order by rr.created_at desc limit 500;
end;
$$;
revoke all on function public.hn_admin_review_reports(text) from public, anon;
grant execute on function public.hn_admin_review_reports(text) to authenticated;

create or replace function public.hn_resolve_review_report(p_report_id uuid, p_status text)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
  if not (select private.is_admin()) then raise exception 'Alleen HN-beheerders.' using errcode='42501'; end if;
  if p_status not in ('reviewed','dismissed','pending') then raise exception 'Ongeldige meldingsstatus.' using errcode='22023'; end if;
  update public.hn_review_reports set status=p_status,resolved_by=(select auth.uid()),resolved_at=case when p_status='pending' then null else now() end where id=p_report_id;
  if not found then raise exception 'Melding niet gevonden.' using errcode='P0002'; end if;
  insert into public.hn_admin_audit_log(admin_id,action,entity_type,entity_id,details)
  values((select auth.uid()),'review_report_resolved','hn_review_report',p_report_id,jsonb_build_object('status',p_status));
  return true;
end;
$$;
revoke all on function public.hn_resolve_review_report(uuid,text) from public, anon;
grant execute on function public.hn_resolve_review_report(uuid,text) to authenticated;

create or replace function private.hn_review_badge_after_publish()
returns trigger language plpgsql security definer set search_path=''
as $$
declare b public.hn_badges; n integer;
begin
  if new.status='published' and (tg_op='INSERT' or old.status is distinct from 'published') then
    select count(*) into n from public.hn_reviews r where r.author_id=new.author_id and r.status='published';
    for b in select * from public.hn_badges where active=true and manual_only=false and trigger_key='review_shared' order by sort_order,name loop
      if n >= greatest(b.threshold,1) then
        insert into public.hn_user_badges(user_id,badge_id,source)
        values(new.author_id,b.id,'automatic') on conflict(user_id,badge_id) do nothing;
      end if;
    end loop;
  end if;
  return new;
end;
$$;
revoke all on function private.hn_review_badge_after_publish() from public, anon, authenticated;
drop trigger if exists hn_review_badge_after_publish on public.hn_reviews;
create trigger hn_review_badge_after_publish after insert or update of status on public.hn_reviews
for each row execute function private.hn_review_badge_after_publish();

-- Configuration changes to passport rewards/access are logged, including edits from the legacy reward admin.
create or replace function private.hn_audit_passport_config()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_entity text; v_action text; v_details jsonb;
begin
  if tg_op='DELETE' then v_id:=old.id; else v_id:=new.id; end if;
  v_entity:=tg_table_name;
  v_action:=lower(tg_op)||'_'||tg_table_name;
  if tg_table_name='hn_badges' then
    if tg_op='DELETE' then v_details:=jsonb_build_object('slug',old.slug,'name',old.name);
    else v_details:=jsonb_build_object('slug',new.slug,'name',new.name,'active',new.active); end if;
  elsif tg_table_name='hn_access_rules' then
    if tg_op='DELETE' then v_details:=jsonb_build_object('feature_key',old.feature_key,'name',old.name);
    else v_details:=jsonb_build_object('feature_key',new.feature_key,'name',new.name,'active',new.active); end if;
  elsif tg_table_name='hn_access_routes' then
    if tg_op='DELETE' then v_details:=jsonb_build_object('label',old.label,'route_type',old.route_type);
    else v_details:=jsonb_build_object('label',new.label,'route_type',new.route_type,'active',new.active); end if;
  else
    if tg_op='DELETE' then v_details:=jsonb_build_object('slug',old.slug,'name',old.name);
    else v_details:=jsonb_build_object('slug',new.slug,'name',new.name,'active',new.active); end if;
  end if;
  if (select auth.uid()) is not null and (select private.is_admin()) then
    insert into public.hn_admin_audit_log(admin_id,action,entity_type,entity_id,details)
    values((select auth.uid()),v_action,v_entity,v_id,v_details);
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function private.hn_audit_passport_config() from public, anon, authenticated;
drop trigger if exists hn_audit_badges_config on public.hn_badges;
create trigger hn_audit_badges_config after insert or update or delete on public.hn_badges for each row execute function private.hn_audit_passport_config();
drop trigger if exists hn_audit_access_rules_config on public.hn_access_rules;
create trigger hn_audit_access_rules_config after insert or update or delete on public.hn_access_rules for each row execute function private.hn_audit_passport_config();
drop trigger if exists hn_audit_access_routes_config on public.hn_access_routes;
create trigger hn_audit_access_routes_config after insert or update or delete on public.hn_access_routes for each row execute function private.hn_audit_passport_config();
drop trigger if exists hn_audit_statuses_config on public.hn_statuses;
create trigger hn_audit_statuses_config after insert or update or delete on public.hn_statuses for each row execute function private.hn_audit_passport_config();
