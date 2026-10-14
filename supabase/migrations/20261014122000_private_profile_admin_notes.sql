-- Preserve any legacy profile moderation notes privately and keep the public profile column empty.
create table if not exists private.hn_profile_admin_notes (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  admin_notes text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
revoke all on table private.hn_profile_admin_notes from public, anon, authenticated;

insert into private.hn_profile_admin_notes(profile_id, admin_notes, updated_at, updated_by)
select p.id, p.admin_notes, coalesce(p.updated_at, now()), null
from public.profiles p
where nullif(trim(coalesce(p.admin_notes, '')), '') is not null
on conflict (profile_id) do nothing;

update public.profiles set admin_notes = null where admin_notes is not null;

create or replace function private.hn_strip_profile_admin_notes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.admin_notes := null;
  return new;
end;
$$;
revoke all on function private.hn_strip_profile_admin_notes() from public, anon, authenticated;

drop trigger if exists hn_strip_profile_admin_notes on public.profiles;
create trigger hn_strip_profile_admin_notes
before insert or update on public.profiles
for each row execute function private.hn_strip_profile_admin_notes();
