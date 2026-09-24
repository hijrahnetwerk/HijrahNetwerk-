alter table public.submissions
  add column if not exists submitter_social text;

alter table public.submissions
  add constraint submissions_submitter_social_length_check
    check (submitter_social is null or char_length(btrim(submitter_social)) between 1 and 200);