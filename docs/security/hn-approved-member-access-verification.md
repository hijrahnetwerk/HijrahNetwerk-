# HN access-control verification checklist

Run after applying `20261013050000_enforce_approved_member_access.sql` in a non-production Supabase environment first.

## Expected access matrix

| Identity | Public articles/fiches | Member-only articles/fiches | Feature catalogue | Feature unlock |
|---|---|---|---|---|
| Anonymous | Published public only | Denied | No rows | Denied |
| Authenticated, pending/rejected | Published public only | Denied | No rows | Denied |
| Approved member, no grant/badge | Published public | Denied for feature-gated content; member visibility follows published visibility policy | Active rules/routes | Locked |
| Approved member with individual grant | Published public | Allowed for approved-member content | Active rules/routes | Allowed only for granted feature |
| Admin | Allowed | Allowed | All active rules/routes | Allowed |

## SQL checks

1. Inspect policies for `public.blogs`, `public.topic`, `public.hn_access_rules`, `public.hn_access_routes`, and `public.hn_user_access` using `pg_policies`.
2. Confirm `blogs_public_select` checks `profiles.application_status = 'approved'` for `access_level = 'members'`.
3. Confirm `Members can view allowed topics` checks approval for both `members` and `approved_members`.
4. Confirm `public.hn_has_access(text)` returns false for pending/rejected users even if a stale row exists in `hn_user_access` or the user owns a badge that otherwise matches an active route.
5. Confirm `public.hn_my_access()` returns no rows for pending/rejected users and returns the active feature list for approved users/admins.
6. Confirm the existing public launch funnel and anonymous waitlist insert policy remain unchanged.
7. Confirm admins can still manage access rules/routes/grants using the existing admin RPCs.
8. Revoke a test user's feature grant and confirm `hn_has_access` returns false unless a valid badge route separately grants that same feature.

## Rollout notes

- Do not treat frontend hiding as security. RLS and RPC checks must enforce access.
- Do not apply this migration directly to production until the SQL diff has been reviewed and the matrix above has been tested in a staging project.
- The Value Exchange Wall (prompt, contribution submission, immediate benefit, and unlock workflow) is a separate product implementation; this migration secures the approval/access foundation but does not claim to implement that workflow.
