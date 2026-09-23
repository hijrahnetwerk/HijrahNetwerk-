-- HN private founder workspace
create table if not exists public.hn_workspace_tasks (
  id uuid primary key default gen_random_uuid(), title text not null, description text,
  status text not null default 'open' check (status in ('open','in_progress','waiting','done','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  due_at timestamptz, project text, category text, source text, auto_created boolean not null default false,
  completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.hn_workspace_ideas (
  id uuid primary key default gen_random_uuid(), title text not null, description text,
  status text not null default 'idea' check (status in ('idea','considering','planned','in_progress','done','parked','rejected')),
  category text, priority text not null default 'normal' check (priority in ('low','normal','high')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.hn_workspace_plan (
  id uuid primary key default gen_random_uuid(), section_key text not null unique, title text not null,
  content text not null default '', status text not null default 'open' check (status in ('open','in_progress','done')),
  updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.hn_workspace_records (
  id uuid primary key default gen_random_uuid(), title text not null,
  record_type text not null default 'idea' check (record_type in ('idea','copyright','decision','document','milestone')),
  content text, version_label text, source text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.hn_workspace_inbox (
  id uuid primary key default gen_random_uuid(), channel text not null check (channel in ('whatsapp','instagram','facebook','email','website','other')),
  sender text, message text not null, status text not null default 'new' check (status in ('new','in_progress','waiting','answered','closed')),
  category text, suggested_action text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.hn_workspace_tasks enable row level security;
alter table public.hn_workspace_ideas enable row level security;
alter table public.hn_workspace_plan enable row level security;
alter table public.hn_workspace_records enable row level security;
alter table public.hn_workspace_inbox enable row level security;
create policy "Admins manage workspace tasks" on public.hn_workspace_tasks for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage workspace ideas" on public.hn_workspace_ideas for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage workspace plan" on public.hn_workspace_plan for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage workspace records" on public.hn_workspace_records for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage workspace inbox" on public.hn_workspace_inbox for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
grant select,insert,update,delete on public.hn_workspace_tasks, public.hn_workspace_ideas, public.hn_workspace_plan, public.hn_workspace_records, public.hn_workspace_inbox to authenticated;
