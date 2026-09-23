create table if not exists public.launch_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  interest text,
  created_at timestamptz not null default now(),
  constraint launch_waitlist_email_unique unique (email)
);

alter table public.launch_waitlist enable row level security;

drop policy if exists "Public can join launch waitlist" on public.launch_waitlist;
create policy "Public can join launch waitlist"
on public.launch_waitlist
for insert
to anon, authenticated
with check (length(trim(email)) between 5 and 320);

drop policy if exists "Admins can read launch waitlist" on public.launch_waitlist;
create policy "Admins can read launch waitlist"
on public.launch_waitlist
for select
to authenticated
using ((select public.is_admin()));

grant insert on table public.launch_waitlist to anon, authenticated;
grant select on table public.launch_waitlist to authenticated;
