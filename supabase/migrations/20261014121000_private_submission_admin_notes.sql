-- Keep internal moderation notes out of member-readable submissions rows.
-- Admin UI reads/writes these notes through narrowly scoped RPCs.
create schema if not exists private;

create table if not exists private.hn_submission_admin_notes (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  admin_notes text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

revoke all on table private.hn_submission_admin_notes from public, anon, authenticated;

insert into private.hn_submission_admin_notes(submission_id, admin_notes, updated_at, updated_by)
select s.id, s.admin_notes, coalesce(s.updated_at, now()), null
from public.submissions s
where nullif(trim(coalesce(s.admin_notes, '')), '') is not null
on conflict (submission_id) do nothing;

update public.submissions set admin_notes = null where admin_notes is not null;

create or replace function public.hn_admin_submission_notes(p_submission_ids uuid[])
returns table(submission_id uuid, admin_notes text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception 'Alleen HN-beheerders mogen interne notities bekijken.' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_submission_ids), 0) > 1000 then
    raise exception 'Te veel inzendingen in één verzoek.' using errcode = '22023';
  end if;
  return query
    select n.submission_id, n.admin_notes
    from private.hn_submission_admin_notes n
    where n.submission_id = any(coalesce(p_submission_ids, '{}'::uuid[]))
    order by n.updated_at desc;
end;
$$;
revoke all on function public.hn_admin_submission_notes(uuid[]) from public, anon;
grant execute on function public.hn_admin_submission_notes(uuid[]) to authenticated;

create or replace function public.hn_admin_set_submission_notes(p_submission_id uuid, p_admin_notes text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception 'Alleen HN-beheerders mogen interne notities wijzigen.' using errcode = '42501';
  end if;
  if p_submission_id is null then
    raise exception 'Inzending ontbreekt.' using errcode = '22023';
  end if;
  if length(coalesce(p_admin_notes, '')) > 4000 then
    raise exception 'De interne notitie mag maximaal 4000 tekens bevatten.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.submissions s where s.id = p_submission_id) then
    raise exception 'Inzending niet gevonden.' using errcode = 'P0002';
  end if;
  if nullif(trim(coalesce(p_admin_notes, '')), '') is null then
    delete from private.hn_submission_admin_notes where submission_id = p_submission_id;
  else
    insert into private.hn_submission_admin_notes(submission_id, admin_notes, updated_at, updated_by)
    values (p_submission_id, trim(p_admin_notes), now(), (select auth.uid()))
    on conflict (submission_id) do update
      set admin_notes = excluded.admin_notes,
          updated_at = excluded.updated_at,
          updated_by = excluded.updated_by;
  end if;
  return true;
end;
$$;
revoke all on function public.hn_admin_set_submission_notes(uuid, text) from public, anon;
grant execute on function public.hn_admin_set_submission_notes(uuid, text) to authenticated;

create or replace function private.hn_strip_submission_admin_notes()
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
revoke all on function private.hn_strip_submission_admin_notes() from public, anon, authenticated;

drop trigger if exists hn_strip_submission_admin_notes on public.submissions;
create trigger hn_strip_submission_admin_notes
before insert or update on public.submissions
for each row execute function private.hn_strip_submission_admin_notes();
