create table if not exists public.hn_edit_proposals (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topic(id) on delete cascade,
  content_type text not null check (content_type in ('fiche','article')),
  proposed_changes jsonb not null default '{}'::jsonb,
  message text,
  submitter_name text,
  submitter_email text,
  status text not null default 'new' check (status in ('new','reviewing','accepted','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

alter table public.hn_edit_proposals enable row level security;

drop policy if exists "Public can submit edit proposals" on public.hn_edit_proposals;
create policy "Public can submit edit proposals"
on public.hn_edit_proposals
for insert
to anon, authenticated
with check (
  topic_id is not null
  and content_type in ('fiche','article')
  and jsonb_typeof(proposed_changes) = 'object'
  and length(coalesce(submitter_name,'')) <= 120
  and length(coalesce(submitter_email,'')) <= 320
  and length(coalesce(message,'')) <= 5000
);

drop policy if exists "Admins manage edit proposals" on public.hn_edit_proposals;
create policy "Admins manage edit proposals"
on public.hn_edit_proposals
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant insert on table public.hn_edit_proposals to anon, authenticated;
grant select, update, delete on table public.hn_edit_proposals to authenticated;
