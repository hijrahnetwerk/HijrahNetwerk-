begin;

-- Restore controlled access to opted-in public profiles without granting
-- direct table-wide SELECT access to other members' profile rows.
create or replace function public.hn_public_profile(p_id uuid)
returns table (
  id uuid,
  display_name text,
  first_name text,
  last_name text,
  bio text,
  application_status text,
  verification_status text,
  profile_visibility boolean,
  show_location boolean,
  show_contributions boolean,
  show_status boolean,
  current_country_id uuid,
  current_city_id uuid,
  hn_status text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select p.id,p.display_name,p.first_name,p.last_name,p.bio,p.application_status,
         p.verification_status,p.profile_visibility,p.show_location,p.show_contributions,
         p.show_status,p.current_country_id,p.current_city_id,p.hn_status
  from public.profiles p
  where p.id = p_id
    and p.application_status = 'approved'
    and p.profile_visibility = true
    and (select auth.uid()) is not null;
$function$;

create or replace function public.hn_public_profiles(p_ids uuid[])
returns table (
  id uuid,
  display_name text,
  first_name text,
  last_name text,
  bio text,
  application_status text,
  verification_status text,
  profile_visibility boolean,
  show_location boolean,
  show_contributions boolean,
  show_status boolean,
  current_country_id uuid,
  current_city_id uuid,
  hn_status text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select p.id,p.display_name,p.first_name,p.last_name,p.bio,p.application_status,
         p.verification_status,p.profile_visibility,p.show_location,p.show_contributions,
         p.show_status,p.current_country_id,p.current_city_id,p.hn_status
  from public.profiles p
  where p.id = any(p_ids)
    and p.application_status = 'approved'
    and p.profile_visibility = true
    and p.show_contributions = true
    and (select auth.uid()) is not null;
$function$;

revoke all on function public.hn_public_profile(uuid) from public;
revoke all on function public.hn_public_profiles(uuid[]) from public;
grant execute on function public.hn_public_profile(uuid) to authenticated;
grant execute on function public.hn_public_profiles(uuid[]) to authenticated;

-- These RPCs bypass table RLS by design, so enforce the same approval gate
-- as the front-end login flow before allowing review submissions or reports.
create or replace function public.hn_submit_review(
  p_target_key text,
  p_target_name text,
  p_country_name text,
  p_city_name text,
  p_category_name text,
  p_rating integer,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := (select auth.uid());
  v_key text := lower(trim(coalesce(p_target_key,'')));
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Log in om een review in te dienen.' using errcode='42501';
  end if;

  if not coalesce((select private.is_admin()), false)
     and not exists (
       select 1 from public.profiles p
       where p.id = v_user and p.application_status = 'approved'
     ) then
    raise exception 'Alleen goedgekeurde HN-leden kunnen reviews indienen.' using errcode='42501';
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
$function$;

create or replace function public.hn_report_review(p_review_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'Log in om een review te melden.' using errcode='42501';
  end if;

  if not coalesce((select private.is_admin()), false)
     and not exists (
       select 1 from public.profiles p
       where p.id = v_user and p.application_status = 'approved'
     ) then
    raise exception 'Alleen goedgekeurde HN-leden kunnen reviews melden.' using errcode='42501';
  end if;

  if length(trim(coalesce(p_reason,''))) < 10 or length(trim(coalesce(p_reason,''))) > 1000 then
    raise exception 'Beschrijf de reden van de melding in 10 tot 1000 tekens.' using errcode='22023';
  end if;
  if not exists(select 1 from public.hn_reviews where id=p_review_id and status='published') then
    raise exception 'Deze review is niet beschikbaar.' using errcode='P0002';
  end if;
  insert into public.hn_review_reports(review_id,reporter_id,reason)
  values(p_review_id,v_user,trim(p_reason));
  update public.hn_reviews set report_count=report_count+1 where id=p_review_id;
  return true;
exception when unique_violation then
  raise exception 'Je hebt deze review al gemeld.' using errcode='23505';
end;
$function$;

-- Cover the foreign keys identified by Supabase's performance advisor.
create index if not exists blogs_author_id_idx
  on public.blogs(author_id);
create index if not exists hn_review_reports_reporter_id_idx
  on public.hn_review_reports(reporter_id);
create index if not exists hn_review_reports_resolved_by_idx
  on public.hn_review_reports(resolved_by);
create index if not exists hn_reviews_moderated_by_idx
  on public.hn_reviews(moderated_by);
create index if not exists hn_user_access_feature_key_idx
  on public.hn_user_access(feature_key);

commit;
