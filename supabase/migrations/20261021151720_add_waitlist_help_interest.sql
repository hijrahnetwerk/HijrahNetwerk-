-- Reconstructed from the production schema and migration history.
-- This migration is already applied in the production database.
-- Restoring the source file keeps the repository migration history complete.
ALTER TABLE public.launch_waitlist
  ADD COLUMN IF NOT EXISTS help_interest boolean NOT NULL DEFAULT false;
