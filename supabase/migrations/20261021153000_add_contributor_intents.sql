-- Explicit opt-in register for people who want to contribute information.
-- Keep it separate from access control: this does not create an account or grant platform access.
alter table public.launch_waitlist
  add column if not exists help_interest boolean not null default false;

create table if not exists public.hn_contributor_intents (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint hn_contributor_intents_email_unique unique (email),
  constraint hn_contributor_intents_email_format check (length(trim(email)) between 5 and 320)
);

alter table public.hn_contributor_intents enable row level security;
revoke all on table public.hn_contributor_intents from public, anon, authenticated;
grant insert on table public.hn_contributor_intents to anon, authenticated;
grant select on table public.hn_contributor_intents to authenticated;

drop policy if exists "HN admins can read contributor intents" on public.hn_contributor_intents;
create policy "HN admins can read contributor intents"
on public.hn_contributor_intents
for select to authenticated
using ((select private.is_admin()));

drop policy if exists "Public can register contributor intent" on public.hn_contributor_intents;
create policy "Public can register contributor intent"
on public.hn_contributor_intents
for insert to anon, authenticated
with check (email is not null and length(trim(email)) between 5 and 320);

comment on table public.hn_contributor_intents is
  'Optional waitlist opt-in to receive a later invitation to contribute information. This is not an account or access grant.';
