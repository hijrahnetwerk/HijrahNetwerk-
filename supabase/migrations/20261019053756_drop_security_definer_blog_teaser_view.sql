-- The article page now uses hn_public_blog_member_teaser, which returns only
-- approved teaser fields. Remove the older owner-context view to eliminate
-- the SECURITY DEFINER VIEW advisory without exposing full member content.
drop view if exists public.blog_member_teasers;
