-- Adds an explicit, optional signal for people who may want to help improve HN content.
-- Apply this migration in Supabase before deploying the matching frontend.
alter table public.launch_waitlist
  add column if not exists help_interest boolean not null default false;

comment on column public.launch_waitlist.help_interest is
  'Optional opt-in signal: registrant may want a later invitation to contribute information to Hijrah Netwerk.';
