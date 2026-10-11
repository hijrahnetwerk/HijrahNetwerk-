-- HN bijdragebeoordeling: een goedgekeurde inzending kan maximaal één set beloningen activeren.
-- Deze migratie is bewust alleen in Git aangemaakt; niet toegepast op productie.
create table if not exists public.hn_contribution_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions(id) on delete cascade,
  reviewed_by uuid not null references auth.users(id),
  status text not null check (status in ('in_review','needs_changes','approved','rejected')),
  notes text,
  awarded_badge_slug text,
  granted_feature_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hn_contribution_reviews enable row level security;
drop policy if exists "HN admins read contribution reviews" on public.hn_contribution_reviews;
create policy "HN admins read contribution reviews"
  on public.hn_contribution_reviews
  for select to authenticated
  using ((select private.is_admin()));

revoke all on public.hn_contribution_reviews from anon, authenticated;
grant select on public.hn_contribution_reviews to authenticated;

create or replace function public.hn_admin_review_contribution(
  p_submission_id uuid,
  p_status text,
  p_admin_notes text default null,
  p_badge_slug text default null,
  p_feature_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_submission public.submissions%rowtype;
  v_review public.hn_contribution_reviews%rowtype;
  v_reviewer uuid := (select auth.uid());
  v_badge_slug text := nullif(btrim(p_badge_slug), '');
  v_feature_key text := nullif(btrim(p_feature_key), '');
  v_notes text := nullif(left(btrim(coalesce(p_admin_notes, '')), 4000), '');
  v_already_approved boolean := false;
begin
  if v_reviewer is null or not coalesce((select private.is_admin()), false) then
    raise exception 'Alleen bevoegde HN-beheerders mogen inzendingen beoordelen.' using errcode = '42501';
  end if;

  if p_status not in ('in_review','needs_changes','approved','rejected') then
    raise exception 'Ongeldige beoordelingsstatus.' using errcode = '22023';
  end if;

  select * into v_submission
  from public.submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Inzending niet gevonden.' using errcode = 'P0002';
  end if;

  select * into v_review
  from public.hn_contribution_reviews
  where submission_id = p_submission_id
  for update;

  v_already_approved := found and v_review.status = 'approved';

  if v_already_approved then
    if p_status <> 'approved' then
      raise exception 'Een goedgekeurde bijdrage wordt niet automatisch teruggedraaid. Pas alleen de notitie aan of gebruik de aparte beheerprocedure.' using errcode = '22023';
    end if;
    if coalesce(v_review.awarded_badge_slug, '') <> coalesce(v_badge_slug, '')
       or coalesce(v_review.granted_feature_key, '') <> coalesce(v_feature_key, '') then
      raise exception 'Deze bijdrage is al beoordeeld en beloond. De beloning kan niet opnieuw worden gewijzigd via dezelfde inzending.' using errcode = '23505';
    end if;
    update public.submissions
      set admin_notes = v_notes, updated_at = now()
      where id = p_submission_id;
    return jsonb_build_object('ok', true, 'already_processed', true, 'status', 'approved');
  end if;

  if p_status = 'approved' and (v_badge_slug is not null or v_feature_key is not null)
     and v_submission.submitted_by is null then
    raise exception 'Deze inzending is niet gekoppeld aan een account en kan daarom geen lidbeloning activeren.' using errcode = '22023';
  end if;

  if p_status = 'approved' and v_badge_slug is not null
     and not exists (select 1 from public.hn_badges b where b.slug = v_badge_slug and b.active) then
    raise exception 'De gekozen stempel bestaat niet of is niet actief.' using errcode = '22023';
  end if;

  if p_status = 'approved' and v_feature_key is not null
     and not exists (select 1 from public.hn_access_rules r where r.feature_key = v_feature_key and r.active) then
    raise exception 'De gekozen toegangssleutel bestaat niet of is niet actief.' using errcode = '22023';
  end if;

  if p_status <> 'approved' then
    v_badge_slug := null;
    v_feature_key := null;
  end if;

  update public.submissions
    set status = p_status,
        admin_notes = v_notes,
        reviewed_at = now(),
        reviewed_by = v_reviewer,
        updated_at = now()
    where id = p_submission_id;

  insert into public.hn_contribution_reviews
    (submission_id, reviewed_by, status, notes, awarded_badge_slug, granted_feature_key)
  values
    (p_submission_id, v_reviewer, p_status, v_notes, v_badge_slug, v_feature_key)
  on conflict (submission_id) do update
    set reviewed_by = excluded.reviewed_by,
        status = excluded.status,
        notes = excluded.notes,
        awarded_badge_slug = coalesce(excluded.awarded_badge_slug, public.hn_contribution_reviews.awarded_badge_slug),
        granted_feature_key = coalesce(excluded.granted_feature_key, public.hn_contribution_reviews.granted_feature_key),
        updated_at = now();

  if p_status = 'approved' and v_submission.submitted_by is not null then
    if v_badge_slug is not null and not private.award_badge(v_submission.submitted_by, v_badge_slug, 'contribution') then
      raise exception 'De stempel kon niet worden toegekend.' using errcode = '22023';
    end if;

    if v_feature_key is not null then
      insert into public.hn_user_access (user_id, feature_key, granted_via, granted_by)
      values (v_submission.submitted_by, v_feature_key, 'contribution', v_reviewer)
      on conflict (user_id, feature_key) do nothing;
    end if;
  end if;

  insert into public.hn_admin_audit_log (admin_id, action, entity_type, entity_id, details)
  values (
    v_reviewer,
    'contribution_reviewed',
    'submission',
    p_submission_id,
    jsonb_build_object(
      'status', p_status,
      'badge_slug', v_badge_slug,
      'feature_key', v_feature_key
    )
  );

  return jsonb_build_object('ok', true, 'already_processed', false, 'status', p_status);
end;
$function$;

revoke all on function public.hn_admin_review_contribution(uuid, text, text, text, text) from public, anon;
grant execute on function public.hn_admin_review_contribution(uuid, text, text, text, text) to authenticated;
