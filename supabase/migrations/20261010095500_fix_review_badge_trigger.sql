create or replace function private.hn_review_badge_after_publish()
returns trigger language plpgsql security definer set search_path=''
as $$
declare b public.hn_badges; n integer;
begin
  if new.status='published' and old.status is distinct from 'published' then
    select count(*) into n from public.hn_reviews r where r.author_id=new.author_id and r.status='published';
    for b in select * from public.hn_badges where active=true and manual_only=false and trigger_key='review_shared' order by sort_order,name loop
      if n >= greatest(b.threshold,1) then
        insert into public.hn_user_badges(user_id,badge_id,source)
        values(new.author_id,b.id,'automatic') on conflict(user_id,badge_id) do nothing;
      end if;
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists hn_review_badge_after_publish on public.hn_reviews;
create trigger hn_review_badge_after_publish after update of status on public.hn_reviews
for each row execute function private.hn_review_badge_after_publish();
