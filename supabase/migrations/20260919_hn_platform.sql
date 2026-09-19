-- HN platform uitbreiding: ledenverificatie, inzendingen en Hijrah Navigatie
-- Eenmalig uitvoeren in Supabase SQL Editor.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists whatsapp_number text,
  add column if not exists current_country_id uuid,
  add column if not exists current_city_id uuid,
  add column if not exists application_status text not null default 'pending',
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists whatsapp_verified boolean not null default false,
  add column if not exists admin_notes text,
  add column if not exists access_code_used text,
  add column if not exists approved_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.topic
  add column if not exists visibility text not null default 'public',
  add column if not exists card_data jsonb not null default '{}'::jsonb,
  add column if not exists verified_at timestamptz,
  add column if not exists last_checked_at timestamptz,
  add column if not exists next_review_at timestamptz,
  add column if not exists submitted_by uuid references auth.users(id) on delete set null,
  add column if not exists source_type text;

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  is_active boolean not null default true,
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references auth.users(id) on delete set null,
  submitter_name text,
  submitter_email text,
  submitter_whatsapp text,
  submission_type text not null default 'information',
  title text,
  country_id uuid references public.countries(id) on delete set null,
  city_id uuid references public.cities(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  content text not null,
  source_name text,
  source_url text,
  requested_visibility text not null default 'public',
  status text not null default 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submissions_status_idx on public.submissions(status);
create index if not exists submissions_created_idx on public.submissions(created_at desc);
create index if not exists topic_visibility_idx on public.topic(visibility);
create index if not exists topic_next_review_idx on public.topic(next_review_at);

alter table public.access_codes enable row level security;
alter table public.submissions enable row level security;
alter table public.profiles enable row level security;

grant select, insert, update on public.submissions to anon, authenticated;
grant select, insert, update, delete on public.access_codes to authenticated;

drop policy if exists "Anyone can submit HN information" on public.submissions;
create policy "Anyone can submit HN information"
on public.submissions
for insert
to anon, authenticated
with check (true);

drop policy if exists "Submitters can view own submissions" on public.submissions;
create policy "Submitters can view own submissions"
on public.submissions
for select
to authenticated
using ((select auth.uid()) = submitted_by);

drop policy if exists "Admins can manage submissions" on public.submissions;
create policy "Admins can manage submissions"
on public.submissions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id or public.is_admin());

drop policy if exists "Users can create pending profile" on public.profiles;
create policy "Users can create pending profile"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
  and application_status = 'pending'
);

drop policy if exists "Users can update safe profile fields" on public.profiles;
create policy "Users can update safe profile fields"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id or public.is_admin())
with check (
  public.is_admin()
  or (
    (select auth.uid()) = id
    and application_status = 'pending'
  )
);

drop policy if exists "Admins can manage access codes" on public.access_codes;
create policy "Admins can manage access codes"
on public.access_codes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public topics are readable" on public.topic;
create policy "Public topics are readable"
on public.topic
for select
to anon, authenticated
using (
  published = true
  and (
    visibility = 'public'
    or (
      visibility = 'members'
      and auth.uid() is not null
    )
    or (
      visibility = 'approved_members'
      and exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
        and p.application_status = 'approved'
      )
    )
    or public.is_admin()
  )
);

-- Zorg dat bestaande openbare topics openbaar blijven.
update public.topic
set visibility = 'public'
where visibility is null;

-- Nieuwe gebruikers krijgen via de bestaande registratieflow een profiel.
-- Deze trigger vult alleen velden aan wanneer er nog geen profiel bestaat.
create or replace function public.handle_hn_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    whatsapp_number,
    application_status,
    verification_status
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'whatsapp_number',
    'pending',
    'unverified'
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = coalesce(public.profiles.first_name, excluded.first_name),
    last_name = coalesce(public.profiles.last_name, excluded.last_name),
    whatsapp_number = coalesce(public.profiles.whatsapp_number, excluded.whatsapp_number);

  return new;
end;
$$;

drop trigger if exists on_hn_auth_user_created on auth.users;
create trigger on_hn_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_hn_new_user();

grant execute on function public.handle_hn_new_user() to authenticated, anon;
