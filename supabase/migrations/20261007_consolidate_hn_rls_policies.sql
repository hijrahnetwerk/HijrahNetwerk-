begin;

drop policy if exists "Public can view active categories" on public.categories;
drop policy if exists "Public can view active cities" on public.cities;
drop policy if exists "Public can view active countries" on public.countries;
drop policy if exists "Public can view active subcategories" on public.subcategories;

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins insert categories" on public.categories for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update categories" on public.categories for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete categories" on public.categories for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins can manage cities" on public.cities;
create policy "Admins insert cities" on public.cities for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update cities" on public.cities for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete cities" on public.cities for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins can manage countries" on public.countries;
create policy "Admins insert countries" on public.countries for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update countries" on public.countries for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete countries" on public.countries for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins can manage subcategories" on public.subcategories;
create policy "Admins insert subcategories" on public.subcategories for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update subcategories" on public.subcategories for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete subcategories" on public.subcategories for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins manage content overrides" on public.hn_content_overrides;
create policy "Admins insert content overrides" on public.hn_content_overrides for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update content overrides" on public.hn_content_overrides for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete content overrides" on public.hn_content_overrides for delete to authenticated using ((select private.is_admin()));

drop policy if exists "HN layout admin manage" on public.hn_page_layout_overrides;
create policy "HN layout insert" on public.hn_page_layout_overrides for insert to authenticated with check ((select private.is_admin()));
create policy "HN layout update" on public.hn_page_layout_overrides for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "HN layout delete" on public.hn_page_layout_overrides for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins manage site settings" on public.hn_site_settings;
create policy "Admins insert site settings" on public.hn_site_settings for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update site settings" on public.hn_site_settings for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete site settings" on public.hn_site_settings for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins manage navigation" on public.hn_navigation_items;
drop policy if exists "Public can view visible navigation" on public.hn_navigation_items;
create policy "Public and admins can view navigation" on public.hn_navigation_items for select to anon,authenticated using ((is_visible=true) or (select private.is_admin()));
create policy "Admins insert navigation" on public.hn_navigation_items for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update navigation" on public.hn_navigation_items for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete navigation" on public.hn_navigation_items for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins manage site pages" on public.hn_site_pages;
drop policy if exists "Public can view published site pages" on public.hn_site_pages;
create policy "Public and admins can view site pages" on public.hn_site_pages for select to anon,authenticated using ((status='published') or (select private.is_admin()));
create policy "Admins insert site pages" on public.hn_site_pages for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update site pages" on public.hn_site_pages for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete site pages" on public.hn_site_pages for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins manage site sections" on public.hn_site_sections;
drop policy if exists "Public can view visible sections of published pages" on public.hn_site_sections;
create policy "Public and admins can view site sections" on public.hn_site_sections for select to anon,authenticated
using (((is_visible=true) and exists(select 1 from public.hn_site_pages p where p.id=hn_site_sections.page_id and p.status='published')) or (select private.is_admin()));
create policy "Admins insert site sections" on public.hn_site_sections for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update site sections" on public.hn_site_sections for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete site sections" on public.hn_site_sections for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins manage edit proposals" on public.hn_edit_proposals;
drop policy if exists "Public can submit edit proposals" on public.hn_edit_proposals;
create policy "Public and admins can submit edit proposals" on public.hn_edit_proposals for insert to anon,authenticated
with check (((topic_id is not null) and content_type=any(array['fiche'::text,'article'::text]) and jsonb_typeof(proposed_changes)='object'::text and length(coalesce(submitter_name,''))<=120 and length(coalesce(submitter_email,''))<=320 and length(coalesce(message,''))<=5000) or (select private.is_admin()));
create policy "Admins view edit proposals" on public.hn_edit_proposals for select to authenticated using ((select private.is_admin()));
create policy "Admins update edit proposals" on public.hn_edit_proposals for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete edit proposals" on public.hn_edit_proposals for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins manage fiche claims" on public.hn_fiche_claims;
drop policy if exists "Public can submit fiche claim" on public.hn_fiche_claims;
create policy "Public and admins can submit fiche claims" on public.hn_fiche_claims for insert to anon,authenticated
with check (((length(trim(name))>=2) and (length(trim(name))<=120) and (length(trim(email))>=5) and (length(trim(email))<=320)) or (select private.is_admin()));
create policy "Admins view fiche claims" on public.hn_fiche_claims for select to authenticated using ((select private.is_admin()));
create policy "Admins update fiche claims" on public.hn_fiche_claims for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete fiche claims" on public.hn_fiche_claims for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins can manage submissions" on public.submissions;
drop policy if exists "Anyone can submit HN information" on public.submissions;
drop policy if exists "Submitters can view own submissions" on public.submissions;
create policy "Public and admins can submit HN information" on public.submissions for insert to anon,authenticated
with check (((status='pending') and reviewed_at is null and reviewed_by is null and admin_notes is null and (submitted_by is null or submitted_by=(select auth.uid()))) or (select private.is_admin()));
create policy "Submitters and admins can view submissions" on public.submissions for select to authenticated using ((submitted_by=(select auth.uid())) or (select private.is_admin()));
create policy "Admins update submissions" on public.submissions for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete submissions" on public.submissions for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins can manage topics" on public.topic;
drop policy if exists "Authenticated can view published topics by visibility" on public.topic;
create policy "Authenticated and admins can view topics" on public.topic for select to authenticated
using (((published=true and (coalesce(visibility,'')=any(array[''::text,'public'::text,'fiche_only'::text]) or (visibility='members' and (select auth.uid()) is not null) or (visibility='approved_members' and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.application_status='approved')))) or (select private.is_admin())));
create policy "Admins insert topics" on public.topic for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update topics" on public.topic for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete topics" on public.topic for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins manage topic relationships" on public.topic_relationships;
drop policy if exists "Public topic relationships are readable" on public.topic_relationships;
create policy "Public and admins can read topic relationships" on public.topic_relationships for select to anon,authenticated using (exists(select 1 from public.topic t where t.id=topic_relationships.topic_id and (t.published=true or (select private.is_admin()))));
create policy "Admins insert topic relationships" on public.topic_relationships for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update topic relationships" on public.topic_relationships for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete topic relationships" on public.topic_relationships for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins manage search terms" on public.topic_search_terms;
drop policy if exists "Public search terms are readable" on public.topic_search_terms;
create policy "Public and admins can read search terms" on public.topic_search_terms for select to anon,authenticated using (exists(select 1 from public.topic t where t.id=topic_search_terms.topic_id and (t.published=true or (select private.is_admin()))));
create policy "Admins insert search terms" on public.topic_search_terms for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update search terms" on public.topic_search_terms for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete search terms" on public.topic_search_terms for delete to authenticated using ((select private.is_admin()));

drop policy if exists "Admins can read all activity" on public.user_activity;
drop policy if exists "Users can view own activity" on public.user_activity;
drop policy if exists "Admins can read all presence" on public.user_presence;
drop policy if exists "Users can view own presence" on public.user_presence;

commit;