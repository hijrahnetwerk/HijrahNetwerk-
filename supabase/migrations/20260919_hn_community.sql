-- HN communitylaag: automatische HN-identiteit, referrals, stempels en feature-toegang.
-- Eenmalig uitvoeren in Supabase SQL Editor vóór de eerste productie-deploy van deze batch.

alter table public.profiles
  add column if not exists public_name text,
  add column if not exists public_code text,
  add column if not exists community_role text not null default 'Communitylid',
  add column if not exists my_hijrah_enabled boolean not null default false,
  add column if not exists referred_by_profile_id uuid references public.profiles(id) on delete set null;

create unique index if not exists profiles_public_code_uidx
  on public.profiles(public_code);

create index if not exists profiles_referred_by_idx
  on public.profiles(referred_by_profile_id);

-- Bestaande profielen krijgen een neutrale openbare identiteit.
update public.profiles
set public_code = 'HN-' || upper(substr(md5(id::text),1,6))
where public_code is null;

update public.profiles
set public_name = 'Communitylid ' ||
  lpad((1000 + mod(abs(hashtext(id::text)),9000))::text,4,'0')
where public_name is null;

update public.profiles
set community_role = coalesce(nullif(community_role,''),'Communitylid');

-- Admins houden toegang tot Mijn Hijrah; gewone goedgekeurde leden krijgen dit
-- alleen wanneer HN het expliciet activeert.
update public.profiles
set my_hijrah_enabled = true
where role = 'admin';

create table if not exists public.hn_stamps (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null,
  criterion text not null,
  threshold integer,
  manual_only boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.hn_stamps(code,name,description,criterion,threshold,manual_only,sort_order)
values
  ('first_contribution','Eerste bijdrage','Eerste goedgekeurde bijdrage.','approved_total',1,false,10),
  ('reviewer','Reviewer','Vijf goedgekeurde reviews.','approved_reviews',5,false,20),
  ('connector','Verbinder','Drie actieve referrals die door HN zijn goedgekeurd.','approved_referrals',3,false,30),
  ('guide','Gids','Tien goedgekeurde inhoudelijke bijdragen.','approved_total',10,false,40),
  ('checker','Controleur','Vijf geaccepteerde correcties.','approved_corrections',5,false,50),
  ('experienced','Ervaren','Vijfentwintig goedgekeurde bijdragen.','approved_total',25,false,60),
  ('contributor','HN Contributor','Vijftig goedgekeurde bijdragen.','approved_total',50,false,70),
  ('trusted','Vertrouwd','Door HN handmatig toegekend wanneer een lid die status heeft opgebouwd.','manual',null,true,80)
on conflict(code) do update set
  name=excluded.name,
  description=excluded.description,
  criterion=excluded.criterion,
  threshold=excluded.threshold,
  manual_only=excluded.manual_only,
  sort_order=excluded.sort_order;

alter table public.hn_stamps enable row level security;

drop policy if exists "HN stamps are publicly readable" on public.hn_stamps;
create policy "HN stamps are publicly readable"
on public.hn_stamps
for select
to anon, authenticated
using (true);

grant select on public.hn_stamps to anon, authenticated;

-- Reviews en persoonlijke ervaringen zijn alleen toegestaan voor goedgekeurde leden.
drop policy if exists "Anyone can submit HN information" on public.submissions;
drop policy if exists "Approved members can submit reviews and experiences" on public.submissions;
drop policy if exists "Anyone can submit non-personal HN information" on public.submissions;

create policy "Approved members can submit reviews and experiences"
on public.submissions
for insert
to authenticated
with check (
  submission_type in ('review','experience')
  and submitted_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.application_status = 'approved'
  )
);

create policy "Anyone can submit non-personal HN information"
on public.submissions
for insert
to anon, authenticated
with check (
  submission_type not in ('review','experience')
  and (
    submitted_by is null
    or submitted_by = (select auth.uid())
  )
);

-- Nieuwe gebruikers krijgen automatisch een neutrale HN-identiteit.
create or replace function public.handle_hn_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_name text;
  v_number integer;
  v_referrer uuid;
begin
  loop
    v_code := 'HN-' || upper(substr(md5(gen_random_uuid()::text),1,6));
    exit when not exists (
      select 1 from public.profiles where public_code = v_code
    );
  end loop;

  v_number := 1000 + floor(random() * 9000)::integer;
  v_name := 'Communitylid ' || lpad(v_number::text,4,'0');

  if trim(coalesce(new.raw_user_meta_data ->> 'referral_code','')) = '' then
    raise exception 'Een HN-refercode is verplicht om een account aan te maken.';
  end if;

  select p.id
  into v_referrer
  from public.profiles p
  where p.public_code = upper(trim(new.raw_user_meta_data ->> 'referral_code'))
    and p.application_status = 'approved'
  limit 1;

  if v_referrer is null then
    raise exception 'Deze HN-refercode bestaat niet of is nog niet actief.';
  end if;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    whatsapp_number,
    application_status,
    verification_status,
    public_name,
    public_code,
    community_role,
    my_hijrah_enabled,
    referred_by_profile_id
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'whatsapp_number',
    'pending',
    'unverified',
    v_name,
    v_code,
    'Communitylid',
    false,
    v_referrer
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = coalesce(public.profiles.first_name, excluded.first_name),
    last_name = coalesce(public.profiles.last_name, excluded.last_name),
    whatsapp_number = coalesce(public.profiles.whatsapp_number, excluded.whatsapp_number),
    referred_by_profile_id = coalesce(public.profiles.referred_by_profile_id, excluded.referred_by_profile_id),
    public_name = coalesce(public.profiles.public_name, excluded.public_name),
    public_code = coalesce(public.profiles.public_code, excluded.public_code);

  return new;
end;
$$;

drop trigger if exists on_hn_auth_user_created on auth.users;
create trigger on_hn_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_hn_new_user();

grant execute on function public.handle_hn_new_user() to authenticated, anon;

-- Publiek profiel: alleen geanonimiseerde communitygegevens.
create or replace function public.get_public_member_profile(p_code text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  p public.profiles%rowtype;
  total_count bigint := 0;
  review_count bigint := 0;
  experience_count bigint := 0;
  correction_count bigint := 0;
  referral_count bigint := 0;
  points bigint := 0;
  level integer := 1;
  display_role text := 'Communitylid';
  stamp_json jsonb := '[]'::jsonb;
begin
  select *
  into p
  from public.profiles
  where upper(public_code) = upper(trim(p_code))
    and application_status = 'approved'
  limit 1;

  if not found then
    return null;
  end if;

  select
    count(*) filter (where status='approved'),
    count(*) filter (where status='approved' and submission_type='review'),
    count(*) filter (where status='approved' and submission_type='experience'),
    count(*) filter (where status='approved' and submission_type='correction')
  into total_count, review_count, experience_count, correction_count
  from public.submissions
  where submitted_by = p.id;

  select count(*)
  into referral_count
  from public.profiles
  where referred_by_profile_id = p.id
    and application_status = 'approved';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'code', s.code,
        'name', s.name,
        'description', s.description
      )
      order by s.sort_order
    ),
    '[]'::jsonb
  )
  into stamp_json
  from public.hn_stamps s
  where s.manual_only = false
    and (
      (s.code='first_contribution' and total_count >= 1)
      or (s.code='reviewer' and review_count >= 5)
      or (s.code='connector' and referral_count >= 3)
      or (s.code='guide' and total_count >= 10)
      or (s.code='checker' and correction_count >= 5)
      or (s.code='experienced' and total_count >= 25)
      or (s.code='contributor' and total_count >= 50)
    );

  points := (total_count*10) + (review_count*10) + (experience_count*8) + (correction_count*12) + (referral_count*20);
  level := 1 + floor(points / 250)::integer;

  display_role :=
    case
      when p.community_role is not null and p.community_role <> 'Communitylid' then p.community_role
      when review_count > 0 then 'Reviewer'
      when total_count > 0 then 'Contributor'
      else 'Communitylid'
    end;

  return jsonb_build_object(
    'public_name', p.public_name,
    'public_code', p.public_code,
    'community_role', display_role,
    'joined_year', extract(year from coalesce(p.approved_at,p.created_at))::integer,
    'reviews_count', review_count,
    'experiences_count', experience_count,
    'approved_contributions_count', total_count,
    'referrals_count', referral_count,
    'points', points,
    'level', level,
    'stamps', stamp_json
  );
end;
$$;

grant execute on function public.get_public_member_profile(text) to anon, authenticated;

create or replace function public.is_valid_hn_referral(p_code text)
returns boolean
language sql
security definer
stable
set search_path = public
as $
  select exists(
    select 1
    from public.profiles
    where public_code = upper(trim(p_code))
      and application_status = 'approved'
  );
$;

grant execute on function public.is_valid_hn_referral(text) to anon, authenticated;

-- Eigen paspoort: alle stempels + behaald/nog niet behaald.
create or replace function public.get_my_hn_passport()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  p public.profiles%rowtype;
  total_count bigint := 0;
  review_count bigint := 0;
  experience_count bigint := 0;
  correction_count bigint := 0;
  referral_count bigint := 0;
  stamp_json jsonb := '[]'::jsonb;
begin
  select *
  into p
  from public.profiles
  where id = (select auth.uid())
  limit 1;

  if not found or p.application_status <> 'approved' then
    return null;
  end if;

  select
    count(*) filter (where status='approved'),
    count(*) filter (where status='approved' and submission_type='review'),
    count(*) filter (where status='approved' and submission_type='experience'),
    count(*) filter (where status='approved' and submission_type='correction')
  into total_count, review_count, experience_count, correction_count
  from public.submissions
  where submitted_by = p.id;

  select count(*)
  into referral_count
  from public.profiles
  where referred_by_profile_id = p.id
    and application_status = 'approved';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'code', s.code,
        'name', s.name,
        'description', s.description,
        'earned',
          case
            when s.code='first_contribution' then total_count >= 1
            when s.code='reviewer' then review_count >= 5
            when s.code='connector' then referral_count >= 3
            when s.code='guide' then total_count >= 10
            when s.code='checker' then correction_count >= 5
            when s.code='experienced' then total_count >= 25
            when s.code='contributor' then total_count >= 50
            else false
          end
      )
      order by s.sort_order
    ),
    '[]'::jsonb
  )
  into stamp_json
  from public.hn_stamps s;

  points := (total_count*10) + (review_count*10) + (experience_count*8) + (correction_count*12) + (referral_count*20);
  level := 1 + floor(points / 250)::integer;

  display_role :=
    case
      when p.community_role is not null and p.community_role <> 'Communitylid' then p.community_role
      when review_count > 0 then 'Reviewer'
      when total_count > 0 then 'Contributor'
      else 'Communitylid'
    end;

  return jsonb_build_object(
    'public_name', p.public_name,
    'public_code', p.public_code,
    'community_role', display_role,
    'joined_year', extract(year from coalesce(p.approved_at,p.created_at))::integer,
    'reviews_count', review_count,
    'experiences_count', experience_count,
    'approved_contributions_count', total_count,
    'referrals_count', referral_count,
    'points', points,
    'level', level,
    'stamps', stamp_json
  );
end;
$$;

grant execute on function public.get_my_hn_passport() to authenticated;
