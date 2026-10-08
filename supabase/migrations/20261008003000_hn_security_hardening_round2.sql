begin;

-- Least privilege for public reference data.
revoke insert, update, delete on public.categories, public.cities, public.countries, public.subcategories from anon, authenticated;
grant select on public.categories, public.cities, public.countries, public.subcategories to anon, authenticated;
drop policy if exists "Public can read categories" on public.categories;
drop policy if exists "Public can read cities" on public.cities;
drop policy if exists "Public can read countries" on public.countries;
drop policy if exists "Public can read subcategories" on public.subcategories;
drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories" on public.categories for select to anon, authenticated using (is_active=true or (select private.is_admin()));
drop policy if exists "Public can read active cities" on public.cities;
create policy "Public can read active cities" on public.cities for select to anon, authenticated using (is_active=true or (select private.is_admin()));
drop policy if exists "Public can read active countries" on public.countries;
create policy "Public can read active countries" on public.countries for select to anon, authenticated using (is_active=true or (select private.is_admin()));
drop policy if exists "Public can read active subcategories" on public.subcategories;
create policy "Public can read active subcategories" on public.subcategories for select to anon, authenticated using (is_active=true or (select private.is_admin()));

-- Public knowledge is readable; writes are admin-only.
revoke insert, update, delete on public.topic from anon, authenticated;
grant select on public.topic to anon, authenticated;
drop policy if exists "Public and members can view topics" on public.topic;
drop policy if exists "Public topics are readable" on public.topic;
drop policy if exists "Anon can view published public topics and fiches" on public.topic;
drop policy if exists "Anonymous can view public topics" on public.topic;
create policy "Anonymous can view public topics" on public.topic for select to anon
using (published=true and coalesce(visibility,'')=any(array['','public','fiche_only']));
drop policy if exists "Members can view allowed topics" on public.topic;
create policy "Members can view allowed topics" on public.topic for select to authenticated
using (
  (published=true and (
    coalesce(visibility,'')=any(array['','public','fiche_only'])
    or visibility='members'
    or (visibility='approved_members' and exists (
      select 1 from public.profiles p
      where p.id=(select auth.uid()) and p.application_status='approved'
    ))
  ))
  or (select private.is_admin())
);

-- Private member data: owner only.
do $$
declare t text;
begin
  foreach t in array array['member_preferences','member_progress','saved_articles','hijrah_plans','hn_personal_items','hn_hijrah_circle','hn_work_sessions'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;
revoke all on public.member_preferences,public.member_progress,public.saved_articles,public.hijrah_plans,public.hn_personal_items,public.hn_hijrah_circle,public.hn_work_sessions from anon;
grant select,insert,update,delete on public.member_preferences,public.member_progress,public.saved_articles,public.hijrah_plans,public.hn_personal_items,public.hn_hijrah_circle,public.hn_work_sessions to authenticated;

drop policy if exists "Members can read own preferences" on public.member_preferences;
drop policy if exists "Members can insert own preferences" on public.member_preferences;
drop policy if exists "Members can update own preferences" on public.member_preferences;
drop policy if exists "Members can delete own preferences" on public.member_preferences;
drop policy if exists "Members read own preferences" on public.member_preferences;
create policy "Members read own preferences" on public.member_preferences for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Members insert own preferences" on public.member_preferences;
create policy "Members insert own preferences" on public.member_preferences for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Members update own preferences" on public.member_preferences;
create policy "Members update own preferences" on public.member_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Members delete own preferences" on public.member_preferences;
create policy "Members delete own preferences" on public.member_preferences for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists "Members can read own progress" on public.member_progress;
drop policy if exists "Members can insert own progress" on public.member_progress;
drop policy if exists "Members can update own progress" on public.member_progress;
drop policy if exists "Members can delete own progress" on public.member_progress;
drop policy if exists "Members read own progress" on public.member_progress;
create policy "Members read own progress" on public.member_progress for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Members insert own progress" on public.member_progress;
create policy "Members insert own progress" on public.member_progress for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Members update own progress" on public.member_progress;
create policy "Members update own progress" on public.member_progress for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Members delete own progress" on public.member_progress;
create policy "Members delete own progress" on public.member_progress for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists "Members can read own saved articles" on public.saved_articles;
drop policy if exists "Members can save own articles" on public.saved_articles;
drop policy if exists "Members can remove own saved articles" on public.saved_articles;
drop policy if exists "Members can update own saved articles" on public.saved_articles;
drop policy if exists "Members read own saved articles" on public.saved_articles;
create policy "Members read own saved articles" on public.saved_articles for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Members insert own saved articles" on public.saved_articles;
create policy "Members insert own saved articles" on public.saved_articles for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Members update own saved articles" on public.saved_articles;
create policy "Members update own saved articles" on public.saved_articles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Members delete own saved articles" on public.saved_articles;
create policy "Members delete own saved articles" on public.saved_articles for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists "Members can read own hijrah plan" on public.hijrah_plans;
drop policy if exists "Members can insert own hijrah plan" on public.hijrah_plans;
drop policy if exists "Members can update own hijrah plan" on public.hijrah_plans;
drop policy if exists "Members can delete own hijrah plan" on public.hijrah_plans;
drop policy if exists "Members read own plans" on public.hijrah_plans;
create policy "Members read own plans" on public.hijrah_plans for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Members insert own plans" on public.hijrah_plans;
create policy "Members insert own plans" on public.hijrah_plans for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Members update own plans" on public.hijrah_plans;
create policy "Members update own plans" on public.hijrah_plans for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Members delete own plans" on public.hijrah_plans;
create policy "Members delete own plans" on public.hijrah_plans for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists "Users manage own personal items" on public.hn_personal_items;
drop policy if exists "Members read own personal items" on public.hn_personal_items;
create policy "Members read own personal items" on public.hn_personal_items for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Members insert own personal items" on public.hn_personal_items;
create policy "Members insert own personal items" on public.hn_personal_items for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Members update own personal items" on public.hn_personal_items;
create policy "Members update own personal items" on public.hn_personal_items for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Members delete own personal items" on public.hn_personal_items;
create policy "Members delete own personal items" on public.hn_personal_items for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists "Users manage own hijrah circle" on public.hn_hijrah_circle;
drop policy if exists "Members read own circle" on public.hn_hijrah_circle;
create policy "Members read own circle" on public.hn_hijrah_circle for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Members insert own circle" on public.hn_hijrah_circle;
create policy "Members insert own circle" on public.hn_hijrah_circle for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Members update own circle" on public.hn_hijrah_circle;
create policy "Members update own circle" on public.hn_hijrah_circle for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Members delete own circle" on public.hn_hijrah_circle;
create policy "Members delete own circle" on public.hn_hijrah_circle for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists "Users manage own work sessions" on public.hn_work_sessions;
drop policy if exists "Members read own work sessions" on public.hn_work_sessions;
create policy "Members read own work sessions" on public.hn_work_sessions for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Members insert own work sessions" on public.hn_work_sessions;
create policy "Members insert own work sessions" on public.hn_work_sessions for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Members update own work sessions" on public.hn_work_sessions;
create policy "Members update own work sessions" on public.hn_work_sessions for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Members delete own work sessions" on public.hn_work_sessions;
create policy "Members delete own work sessions" on public.hn_work_sessions for delete to authenticated using ((select auth.uid())=user_id);

-- Activity and presence.
revoke all on public.user_activity,public.user_presence from anon;
grant select,insert on public.user_activity to authenticated;
grant select,insert,update on public.user_presence to authenticated;
drop policy if exists "Users can insert own activity" on public.user_activity;
drop policy if exists "Users and admins can view activity" on public.user_activity;
drop policy if exists "Users insert own activity" on public.user_activity;
create policy "Users insert own activity" on public.user_activity for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Users and admins view activity" on public.user_activity;
create policy "Users and admins view activity" on public.user_activity for select to authenticated using (user_id=(select auth.uid()) or (select private.is_admin()));
drop policy if exists "Users can insert own presence" on public.user_presence;
drop policy if exists "Users can update own presence" on public.user_presence;
drop policy if exists "Users and admins can view presence" on public.user_presence;
drop policy if exists "Users insert own presence" on public.user_presence;
create policy "Users insert own presence" on public.user_presence for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Users update own presence" on public.user_presence;
create policy "Users update own presence" on public.user_presence for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users and admins view presence" on public.user_presence;
create policy "Users and admins view presence" on public.user_presence for select to authenticated using (user_id=(select auth.uid()) or (select private.is_admin()));

-- Public contribution workflows are create-only and review state cannot be forged.
drop policy if exists "Public and admins can submit edit proposals" on public.hn_edit_proposals;
drop policy if exists "Public and admins can submit edit proposals" on public.hn_edit_proposals;
create policy "Public and admins can submit edit proposals" on public.hn_edit_proposals for insert to anon,authenticated
with check (
  (status='new' and reviewed_at is null and reviewed_by is null and topic_id is not null
   and content_type=any(array['fiche','article'])
   and jsonb_typeof(proposed_changes)='object'
   and octet_length(proposed_changes::text)<=50000
   and length(coalesce(submitter_name,''))<=120
   and length(coalesce(submitter_email,''))<=320
   and length(coalesce(message,''))<=5000)
  or (select private.is_admin())
);
drop policy if exists "Public and admins can submit fiche claims" on public.hn_fiche_claims;
drop policy if exists "Public and admins can submit fiche claims" on public.hn_fiche_claims;
create policy "Public and admins can submit fiche claims" on public.hn_fiche_claims for insert to anon,authenticated
with check (
  (status='new' and reviewed_at is null
   and length(trim(name)) between 2 and 120
   and length(trim(email)) between 5 and 320
   and length(coalesce(role,''))<=120
   and length(coalesce(phone,''))<=80
   and length(coalesce(message,''))<=5000)
  or (select private.is_admin())
);

-- Do not expose internal submission notes/status to submitters.
drop policy if exists "Submitters and admins can view submissions" on public.submissions;
drop policy if exists "Admins can view submissions" on public.submissions;
drop policy if exists "Admins can view submissions" on public.submissions;
create policy "Admins can view submissions" on public.submissions for select to authenticated using ((select private.is_admin()));
revoke update,delete on public.submissions from anon;
alter table public.submissions
  drop constraint if exists submissions_content_length_check,
  drop constraint if exists submissions_title_length_check,
  drop constraint if exists submissions_email_length_check,
  drop constraint if exists submissions_whatsapp_length_check,
  drop constraint if exists submissions_source_url_length_check,
  drop constraint if exists submissions_details_size_check;
alter table public.submissions
  add constraint submissions_content_length_check check (char_length(content) between 1 and 100000),
  add constraint submissions_title_length_check check (title is null or char_length(title)<=240),
  add constraint submissions_email_length_check check (submitter_email is null or char_length(submitter_email)<=320),
  add constraint submissions_whatsapp_length_check check (submitter_whatsapp is null or char_length(submitter_whatsapp)<=80),
  add constraint submissions_source_url_length_check check (source_url is null or char_length(source_url)<=2048),
  add constraint submissions_details_size_check check (octet_length(details::text)<=100000);

-- Internal builder definitions/templates are admin-only.
revoke select on public.hn_component_definitions,public.hn_page_templates from anon;
drop policy if exists "HN component definitions read" on public.hn_component_definitions;
drop policy if exists "HN templates read" on public.hn_page_templates;
drop policy if exists "HN component definitions admin read" on public.hn_component_definitions;
create policy "HN component definitions admin read" on public.hn_component_definitions for select to authenticated using ((select private.is_admin()));
drop policy if exists "HN templates admin read" on public.hn_page_templates;
create policy "HN templates admin read" on public.hn_page_templates for select to authenticated using ((select private.is_admin()));

-- Visual overrides expose only fields needed by the public renderer.
revoke select on public.hn_content_overrides,public.hn_page_layout_overrides from anon,authenticated;
grant select (route,selector,element_type,content_text) on public.hn_content_overrides to anon,authenticated;
grant select (route,selector,sort_order,is_visible,settings) on public.hn_page_layout_overrides to anon,authenticated;

-- Audit/version history is append-only.
revoke update,delete on public.hn_admin_audit_log from authenticated;
drop policy if exists "Admins manage audit log" on public.hn_admin_audit_log;
drop policy if exists "Admins read audit log" on public.hn_admin_audit_log;
create policy "Admins read audit log" on public.hn_admin_audit_log for select to authenticated using ((select private.is_admin()));
drop policy if exists "Admins insert audit log" on public.hn_admin_audit_log;
create policy "Admins insert audit log" on public.hn_admin_audit_log for insert to authenticated with check ((select private.is_admin()));
revoke update,delete on public.hn_site_page_versions from authenticated;
drop policy if exists "Admins manage page versions" on public.hn_site_page_versions;
drop policy if exists "Admins read page versions" on public.hn_site_page_versions;
create policy "Admins read page versions" on public.hn_site_page_versions for select to authenticated using ((select private.is_admin()));
drop policy if exists "Admins insert page versions" on public.hn_site_page_versions;
create policy "Admins insert page versions" on public.hn_site_page_versions for insert to authenticated with check ((select private.is_admin()));
revoke update,delete on public.hn_workspace_record_versions from authenticated;
drop policy if exists "Admins manage workspace record versions" on public.hn_workspace_record_versions;
drop policy if exists "Admins read workspace record versions" on public.hn_workspace_record_versions;
create policy "Admins read workspace record versions" on public.hn_workspace_record_versions for select to authenticated using ((select private.is_admin()));
drop policy if exists "Admins insert workspace record versions" on public.hn_workspace_record_versions;
create policy "Admins insert workspace record versions" on public.hn_workspace_record_versions for insert to authenticated with check ((select private.is_admin()));

-- Stale builder table has no browser API surface.
revoke all on public.hn_site_blocks from anon,authenticated;

-- Atomic CMS save: one transaction for page, sections, version and audit event.
create or replace function public.hn_admin_save_page(
  p_page_id uuid,p_payload jsonb,p_sections jsonb,p_publish boolean default false
)
returns integer language plpgsql security definer set search_path=''
as $$
declare next_version integer; now_ts timestamptz:=now(); user_id uuid:=(select auth.uid()); section_count integer; page_payload jsonb:=coalesce(p_payload,'{}'::jsonb);
begin
  if not (select private.is_admin()) then raise exception 'Admin access required'; end if;
  if p_page_id is null then raise exception 'Page id is required'; end if;
  if jsonb_typeof(coalesce(p_sections,'[]'::jsonb))<>'array' then raise exception 'Sections must be an array'; end if;
  section_count:=jsonb_array_length(coalesce(p_sections,'[]'::jsonb));
  if section_count>200 then raise exception 'Too many page sections'; end if;
  if not exists(select 1 from public.hn_site_pages where id=p_page_id) then raise exception 'Page not found'; end if;
  update public.hn_site_pages
    set title=left(coalesce(page_payload->>'title','Zonder titel'),240),
        slug=left(coalesce(page_payload->>'slug',''),180),
        status=case when p_publish then 'published' else coalesce(nullif(page_payload->>'status',''),'draft') end,
        description=left(coalesce(page_payload->>'description',''),1000),
        seo_title=left(coalesce(page_payload->>'seo_title',''),240),
        seo_description=left(coalesce(page_payload->>'seo_description',''),320),
        settings=case when jsonb_typeof(page_payload->'settings')='object' then page_payload->'settings' else '{}'::jsonb end,
        updated_at=now_ts
  where id=p_page_id;
  delete from public.hn_site_sections where page_id=p_page_id;
  insert into public.hn_site_sections(page_id,section_type,title,content,sort_order,is_visible,component_type,component_id,data,settings,created_at,updated_at)
  select p_page_id,coalesce(nullif(s->>'section_type',''),nullif(s->>'component_type',''),'content'),
         left(coalesce(s->>'title',''),240),
         case when jsonb_typeof(s->'content')='object' then s->'content' else '{}'::jsonb end,
         coalesce((s->>'sort_order')::integer,ordinality-1),
         coalesce((s->>'is_visible')::boolean,true),
         nullif(s->>'component_type',''),nullif(s->>'component_id',''),
         case when jsonb_typeof(s->'data')='object' then s->'data' else '{}'::jsonb end,
         case when jsonb_typeof(s->'settings')='object' then s->'settings' else '{}'::jsonb end,
         now_ts,now_ts
  from jsonb_array_elements(coalesce(p_sections,'[]'::jsonb)) with ordinality x(s,ordinality);
  select coalesce(max(version_number),0)+1 into next_version from public.hn_site_page_versions where page_id=p_page_id;
  insert into public.hn_site_page_versions(page_id,version_number,snapshot,created_by,created_at)
  values(p_page_id,next_version,jsonb_build_object('page',page_payload||jsonb_build_object('id',p_page_id),'sections',coalesce(p_sections,'[]'::jsonb)),user_id,now_ts);
  insert into public.hn_admin_events(action,entity_type,entity_id,route,metadata)
  values(case when p_publish then 'publish_page' else 'save_page' end,'hn_site_page',p_page_id,'/'||coalesce(page_payload->>'slug',''),jsonb_build_object('version',next_version,'section_count',section_count));
  return next_version;
end;
$$;
revoke execute on function public.hn_admin_save_page(uuid,jsonb,jsonb,boolean) from public,anon;
grant execute on function public.hn_admin_save_page(uuid,jsonb,jsonb,boolean) to authenticated;

-- Abuse protection for public writes at the Data API boundary.
create table if not exists private.hn_rate_limits(id bigint generated always as identity primary key,ip inet not null,bucket text not null,request_at timestamptz not null default now());
alter table private.hn_rate_limits add column if not exists id bigint generated always as identity;
alter table private.hn_rate_limits drop constraint if exists hn_rate_limits_pkey;
alter table private.hn_rate_limits add constraint hn_rate_limits_pkey primary key(id);
create index if not exists hn_rate_limits_ip_bucket_time_idx on private.hn_rate_limits(ip,bucket,request_at desc);
create index if not exists hn_rate_limits_time_idx on private.hn_rate_limits(request_at desc);
create or replace function private.hn_pre_request()
returns void language plpgsql security definer set search_path=''
as $$
declare v_method text:=upper(coalesce(current_setting('request.method',true),''));
v_path text:=coalesce(current_setting('request.path',true),'');v_role text:=coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','anon');v_headers jsonb;
v_ip_text text;v_client_ip inet;v_bucket text;v_window_start timestamptz;v_limit integer;v_recent_count integer;
begin
  if v_method not in('POST','PUT','PATCH','DELETE') or v_role<>'anon' then return; end if;
  if v_path not in('/rest/v1/submissions','/rest/v1/hn_edit_proposals','/rest/v1/hn_fiche_claims','/rest/v1/launch_waitlist','/rest/v1/hn_search_events') then return; end if;
  v_headers:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}'::jsonb);
  v_ip_text:=coalesce(nullif(v_headers->>'cf-connecting-ip',''),nullif(split_part(coalesce(v_headers->>'x-forwarded-for',''),',',1),''));
  begin v_client_ip:=v_ip_text::inet; exception when others then return; end;
  v_bucket:=case when v_path='/rest/v1/hn_search_events' then 'search-events' else 'public-forms' end;
  v_limit:=case when v_bucket='search-events' then 120 else 20 end;
  v_window_start:=now()-interval '5 minutes';
  delete from private.hn_rate_limits where request_at<now()-interval '15 minutes';
  select count(*) into v_recent_count from private.hn_rate_limits r where r.ip=v_client_ip and r.bucket=v_bucket and r.request_at>=v_window_start;
  if v_recent_count>=v_limit then
    raise sqlstate 'PGRST' using message=json_build_object('message','Te veel verzoeken. Probeer het over enkele minuten opnieuw.')::text,
      detail=json_build_object('status',429,'status_text','Too Many Requests')::text;
  end if;
  insert into private.hn_rate_limits(ip,bucket,request_at) values(v_client_ip,v_bucket,now());
exception when sqlstate 'PGRST' then raise; when others then return;
end;
$$;
revoke all on function private.hn_pre_request() from public,anon,authenticated;
grant execute on function private.hn_pre_request() to anon,authenticated,authenticator;
alter role authenticator set pgrst.db_pre_request='private.hn_pre_request';
notify pgrst,'reload config';

commit;