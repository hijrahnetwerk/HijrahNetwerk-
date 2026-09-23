create table if not exists public.hn_workspace_record_versions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.hn_workspace_records(id) on delete cascade,
  version_no integer not null,
  title text not null,
  record_type text not null,
  version_label text,
  source text,
  content text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique(record_id, version_no)
);
alter table public.hn_workspace_record_versions enable row level security;
create policy "Admins manage workspace record versions" on public.hn_workspace_record_versions
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
grant select, insert, update, delete on public.hn_workspace_record_versions to authenticated;
create or replace function public.hn_workspace_snapshot_record()
returns trigger language plpgsql security definer set search_path=public as $$
declare next_no integer;
begin
  select coalesce(max(version_no),0)+1 into next_no from public.hn_workspace_record_versions where record_id=new.id;
  insert into public.hn_workspace_record_versions(record_id,version_no,title,record_type,version_label,source,content,created_by)
  values(new.id,next_no,new.title,new.record_type,new.version_label,new.source,new.content,auth.uid());
  return new;
end; $$;
drop trigger if exists trg_hn_workspace_record_version on public.hn_workspace_records;
create trigger trg_hn_workspace_record_version after insert or update on public.hn_workspace_records
for each row execute function public.hn_workspace_snapshot_record();
revoke all on function public.hn_workspace_snapshot_record() from public,anon,authenticated;
