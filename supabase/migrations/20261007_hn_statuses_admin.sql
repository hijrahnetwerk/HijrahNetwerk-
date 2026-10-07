create table if not exists public.hn_statuses (id uuid primary key default gen_random_uuid(),slug text not null unique,name text not null,description text,icon text default '•',active boolean not null default true,show_on_profile boolean not null default true,sort_order integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.hn_statuses enable row level security;
drop policy if exists "HN statuses readable by authenticated" on public.hn_statuses;
create policy "HN statuses readable by authenticated" on public.hn_statuses for select to authenticated using (active = true or (select private.is_admin()));
drop policy if exists "Admins manage HN statuses" on public.hn_statuses;
create policy "Admins manage HN statuses" on public.hn_statuses for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
insert into public.hn_statuses (slug,name,description,icon,sort_order) values
('lid','Lid','Geregistreerd HN-lid.','•',10),
('bijdrager','HN-bijdrager','Draagt inhoud of praktische informatie bij aan HN.','✦',20),
('reviewer','Reviewer','Helpt HN-informatie controleren en beoordelen.','✓',30),
('ervaren_emigrant','Ervaren emigrant','Heeft eigen ervaring met emigratie/hijrah en deelt die waar passend.','◎',40),
('lokale_bijdrager','Lokale bijdrager','Draagt vanuit de huidige woonplaats praktische lokale informatie bij.','⌂',50),
('moderator','Moderator','Helpt mee met het bewaken van community en inhoud.','◈',60),
('team','HN-team','Maakt deel uit van het HN-team.','◆',70)
on conflict (slug) do update set name=excluded.name,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order,updated_at=now();
grant select on public.hn_statuses to authenticated;
grant all on public.hn_statuses to authenticated;
create index if not exists hn_statuses_active_sort_idx on public.hn_statuses(active,sort_order);