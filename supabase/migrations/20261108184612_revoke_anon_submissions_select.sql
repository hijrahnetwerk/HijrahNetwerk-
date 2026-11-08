-- Anonymous visitors may submit HN information, but must not read submissions.
-- Authenticated members retain access to their own submissions through RLS.
REVOKE SELECT ON TABLE public.submissions FROM anon;
