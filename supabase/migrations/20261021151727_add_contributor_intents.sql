-- Reconstructed from the production schema and migration history.
-- This migration is already applied in the production database.
-- Restoring the source file keeps the repository migration history complete.
CREATE TABLE IF NOT EXISTS public.hn_contributor_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hn_contributor_intents_email_length
    CHECK (length(trim(email)) >= 5 AND length(trim(email)) <= 320),
  CONSTRAINT hn_contributor_intents_email_unique UNIQUE (email)
);

ALTER TABLE public.hn_contributor_intents ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON TABLE public.hn_contributor_intents TO anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.hn_contributor_intents TO authenticated;

DROP POLICY IF EXISTS "HN admins can read contributor intents"
  ON public.hn_contributor_intents;
CREATE POLICY "HN admins can read contributor intents"
  ON public.hn_contributor_intents
  FOR SELECT TO authenticated
  USING ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Public can register contributor intent"
  ON public.hn_contributor_intents;
CREATE POLICY "Public can register contributor intent"
  ON public.hn_contributor_intents
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(trim(email)) >= 5
    AND length(trim(email)) <= 320
  );
