create table if not exists public.hn_fiche_proposals (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topic(id) on delete cascade,
  proposed_card_data jsonb not null default '{}'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  notes text,
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected')),
  generated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(topic_id)
);

alter table public.hn_fiche_proposals enable row level security;

drop policy if exists "Admins manage fiche proposals" on public.hn_fiche_proposals;
create policy "Admins manage fiche proposals"
on public.hn_fiche_proposals
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant select, insert, update, delete on public.hn_fiche_proposals to authenticated;