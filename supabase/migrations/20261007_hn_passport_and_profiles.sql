-- HN Paspoort, stempels en bijdragerprofielen
create schema if not exists private;
create table if not exists public.hn_badges (
 id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, description text,
 category text not null default 'mijlpaal', icon text not null default '✦', trigger_key text,
 threshold integer not null default 1, manual_only boolean not null default false, show_on_profile boolean not null default true,
 active boolean not null default true, sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.hn_user_badges (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 badge_id uuid not null references public.hn_badges(id) on delete cascade, earned_at timestamptz not null default now(),
 awarded_by uuid references auth.users(id) on delete set null, source text not null default 'automatic', unique(user_id,badge_id)
);
alter table public.hn_badges enable row level security; alter table public.hn_user_badges enable row level security;
grant select on public.hn_badges,public.hn_user_badges to authenticated;
drop policy if exists "Members can view active HN badges" on public.hn_badges;
create policy "Members can view active HN badges" on public.hn_badges for select to authenticated using (active=true or (select private.is_admin()));
drop policy if exists "Admins manage HN badges" on public.hn_badges;
create policy "Admins manage HN badges" on public.hn_badges for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "Members can view HN user badges" on public.hn_user_badges;
create policy "Members can view HN user badges" on public.hn_user_badges for select to authenticated using (
 user_id=(select auth.uid()) or (select private.is_admin()) or exists(
 select 1 from public.profiles p join public.hn_badges b on b.id=hn_user_badges.badge_id
 where p.id=hn_user_badges.user_id and p.application_status='approved' and p.profile_visibility=true and p.show_contributions=true and b.show_on_profile=true
 ));
drop policy if exists "Admins manage HN user badges" on public.hn_user_badges;
create policy "Admins manage HN user badges" on public.hn_user_badges for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create or replace function private.award_badge(p_user_id uuid,p_badge_slug text,p_source text default 'automatic')
returns boolean language plpgsql security definer set search_path=''
as $$ declare b public.hn_badges; u uuid:=(select auth.uid()); begin
 if p_user_id is null then return false; end if;
 if u is not null and u<>p_user_id and not (select private.is_admin()) then return false; end if;
 select * into b from public.hn_badges where slug=p_badge_slug and active=true limit 1; if not found then return false; end if;
 insert into public.hn_user_badges(user_id,badge_id,source,awarded_by) values(p_user_id,b.id,p_source,case when p_source='manual' then u else null end) on conflict(user_id,badge_id) do nothing;
 return true; end $$;
revoke execute on function private.award_badge(uuid,text,text) from public,anon; grant usage on schema private to authenticated; grant execute on function private.award_badge(uuid,text,text) to authenticated;

create or replace function private.evaluate_badges(p_user_id uuid,p_trigger_key text)
returns integer language plpgsql security definer set search_path=''
as $$ declare b public.hn_badges; n integer:=0; awarded integer:=0; begin
 if p_user_id is null then return 0; end if;
 for b in select * from public.hn_badges where active=true and manual_only=false and trigger_key=p_trigger_key order by sort_order,name loop
  if p_trigger_key='profile_created' then select count(*) into n from public.profiles where id=p_user_id and application_status='approved';
  elsif p_trigger_key='progress_completed' then select count(*) into n from public.member_progress where user_id=p_user_id and completed=true;
  elsif p_trigger_key='topic_submitted' then select count(*) into n from public.topic where submitted_by=p_user_id and published=true;
  elsif p_trigger_key='experience_shared' then select count(*) into n from public.topic where submitted_by=p_user_id and published=true and lower(coalesce(information_type,''))='ervaring';
  elsif p_trigger_key='review_shared' then select count(*) into n from public.topic where submitted_by=p_user_id and published=true and lower(coalesce(information_type,''))='review';
  elsif p_trigger_key='fiche_contribution' then select count(*) into n from public.topic where submitted_by=p_user_id and published=true and visibility='fiche_only';
  elsif p_trigger_key='plan_started' then select count(*) into n from public.hijrah_plans where user_id=p_user_id;
  elsif p_trigger_key='circle_stage' then select count(*) into n from public.hn_hijrah_circle where user_id=p_user_id and coalesce(jsonb_array_length(completed_stages),0)>=b.threshold;
  end if;
  if n>=greatest(b.threshold,1) then insert into public.hn_user_badges(user_id,badge_id,source) values(p_user_id,b.id,'automatic') on conflict(user_id,badge_id) do nothing; if found then awarded:=awarded+1; end if; end if;
 end loop; return awarded; end $$;
revoke execute on function private.evaluate_badges(uuid,text) from public,anon; grant execute on function private.evaluate_badges(uuid,text) to authenticated;

create or replace function private.badge_after_progress() returns trigger language plpgsql security definer set search_path='' as $$ begin if new.completed=true then perform private.evaluate_badges(new.user_id,'progress_completed'); end if; return new; end $$;
create or replace function private.badge_after_topic() returns trigger language plpgsql security definer set search_path='' as $$ begin if new.submitted_by is not null and new.published=true then perform private.evaluate_badges(new.submitted_by,'topic_submitted'); if lower(coalesce(new.information_type,''))='ervaring' then perform private.evaluate_badges(new.submitted_by,'experience_shared'); end if; if lower(coalesce(new.information_type,''))='review' then perform private.evaluate_badges(new.submitted_by,'review_shared'); end if; if coalesce(new.visibility,'')='fiche_only' then perform private.evaluate_badges(new.submitted_by,'fiche_contribution'); end if; end if; return new; end $$;
create or replace function private.badge_after_plan() returns trigger language plpgsql security definer set search_path='' as $$ begin perform private.evaluate_badges(new.user_id,'plan_started'); return new; end $$;
create or replace function private.badge_after_circle() returns trigger language plpgsql security definer set search_path='' as $$ begin perform private.evaluate_badges(new.user_id,'circle_stage'); return new; end $$;
drop trigger if exists hn_badges_after_progress on public.member_progress; create trigger hn_badges_after_progress after insert or update of completed on public.member_progress for each row execute function private.badge_after_progress();
drop trigger if exists hn_badges_after_topic on public.topic; create trigger hn_badges_after_topic after insert or update of published on public.topic for each row execute function private.badge_after_topic();
drop trigger if exists hn_badges_after_plan on public.hijrah_plans; create trigger hn_badges_after_plan after insert or update on public.hijrah_plans for each row execute function private.badge_after_plan();
drop trigger if exists hn_badges_after_circle on public.hn_hijrah_circle; create trigger hn_badges_after_circle after insert or update on public.hn_hijrah_circle for each row execute function private.badge_after_circle();

insert into public.hn_badges(slug,name,description,category,icon,trigger_key,threshold,sort_order) values
('eerste-stap','Eerste stap','Je hebt je eerste voortgangsitem afgerond.','oriënteren','1','progress_completed',1,10),
('onderzoeker','Onderzoeker','Je hebt vijf voortgangsitems afgerond.','onderzoeken','2','progress_completed',5,20),
('voorbereid','Voorbereid','Je hebt tien voortgangsitems afgerond.','voorbereiden','3','progress_completed',10,30),
('eerste-bijdrage','Eerste bijdrage','Je eerste gepubliceerde HN-bijdrage staat live.','bijdragen','4','topic_submitted',1,40),
('ervaringsdeler','Ervaringsdeler','Je hebt je eerste ervaring gedeeld.','bijdragen','5','experience_shared',1,50),
('reviewer','Reviewer','Je eerste review is gepubliceerd.','bijdragen','6','review_shared',1,60),
('fiche-bijdrager','Fiche-bijdrager','Je eerste bijdrage aan een HN-fiche is gepubliceerd.','bijdragen','7','fiche_contribution',1,70),
('hijrah-plan','Mijn Hijrah Plan','Je hebt je persoonlijke Hijrah Plan gestart.','mijn hijrah','8','plan_started',1,80),
('hijrah-cirkel','HN Hijrah Cirkel','Je hebt drie fasen van je Hijrah Cirkel doorlopen.','mijn hijrah','9','circle_stage',3,90)
on conflict(slug) do update set name=excluded.name,description=excluded.description,category=excluded.category,icon=excluded.icon,trigger_key=excluded.trigger_key,threshold=excluded.threshold,sort_order=excluded.sort_order,updated_at=now();

do $$ declare p record; begin for p in select id from public.profiles where application_status='approved' loop
 perform private.evaluate_badges(p.id,'profile_created'); perform private.evaluate_badges(p.id,'progress_completed'); perform private.evaluate_badges(p.id,'topic_submitted'); perform private.evaluate_badges(p.id,'experience_shared'); perform private.evaluate_badges(p.id,'review_shared'); perform private.evaluate_badges(p.id,'fiche_contribution'); perform private.evaluate_badges(p.id,'plan_started'); perform private.evaluate_badges(p.id,'circle_stage');
end loop; end $$;

-- Admin-only RPC for manual badge assignment.
create or replace function public.award_hn_badge(p_user_id uuid,p_badge_slug text,p_source text default 'manual')
returns boolean language plpgsql security definer set search_path=''
as $$ begin
 if (select auth.uid()) is null or not (select private.is_admin()) then return false; end if;
 return private.award_badge(p_user_id,p_badge_slug,p_source);
end $$;
revoke execute on function public.award_hn_badge(uuid,text,text) from public,anon;
grant execute on function public.award_hn_badge(uuid,text,text) to authenticated;
