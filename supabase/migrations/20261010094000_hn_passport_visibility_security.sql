-- Let members control only their own badge visibility through a narrow RPC.
create or replace function public.hn_set_my_badge_visibility(p_show boolean)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'Log in om deze instelling te wijzigen.' using errcode='42501'; end if;
  update public.profiles set show_badges=coalesce(p_show,false),updated_at=now() where id=v_user;
  if not found then raise exception 'Profiel niet gevonden.' using errcode='P0002'; end if;
  return true;
end;
$$;
revoke all on function public.hn_set_my_badge_visibility(boolean) from public,anon;
grant execute on function public.hn_set_my_badge_visibility(boolean) to authenticated;

-- Publicly shared badge rows must also respect the badge's own profile visibility setting.
drop policy if exists "Members read shared badges" on public.hn_user_badges;
create policy "Members read shared badges"
on public.hn_user_badges for select to authenticated
using (
  exists (
    select 1
    from public.profiles p
    join public.hn_badges b on b.id=hn_user_badges.badge_id
    where p.id=hn_user_badges.user_id
      and p.application_status='approved'
      and p.profile_visibility=true
      and p.show_badges=true
      and b.show_on_profile=true
  )
);
