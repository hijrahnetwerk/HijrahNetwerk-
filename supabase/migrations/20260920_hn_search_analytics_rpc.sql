-- Reliable public search analytics via a SECURITY DEFINER RPC.
-- This avoids relying on direct INSERT privileges/identity sequence permissions
-- from the public browser client.

create or replace function public.log_hn_search_event(
  p_query text,
  p_normalized_query text,
  p_result_count integer default 0,
  p_clicked_topic_id uuid default null,
  p_event_type text default 'search'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type not in ('search','click') then
    raise exception 'Invalid event type';
  end if;

  if p_query is null
     or length(trim(p_query)) < 1
     or length(trim(p_query)) > 240 then
    raise exception 'Invalid query';
  end if;

  if p_normalized_query is null
     or length(trim(p_normalized_query)) < 1
     or length(trim(p_normalized_query)) > 240 then
    raise exception 'Invalid normalized query';
  end if;

  if p_result_count is null
     or p_result_count < 0
     or p_result_count > 10000 then
    raise exception 'Invalid result count';
  end if;

  if p_event_type = 'click' and p_clicked_topic_id is null then
    raise exception 'Click requires a topic id';
  end if;

  insert into public.hn_search_events (
    query,
    normalized_query,
    result_count,
    clicked_topic_id,
    event_type
  )
  values (
    left(trim(p_query),240),
    left(trim(p_normalized_query),240),
    p_result_count,
    p_clicked_topic_id,
    p_event_type
  );
end;
$$;

revoke all on function public.log_hn_search_event(text,text,integer,uuid,text) from public;
grant execute on function public.log_hn_search_event(text,text,integer,uuid,text) to anon, authenticated;
