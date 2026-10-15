# HN access-control verification checklist

Run the migration and tests in a disposable, non-production Supabase environment first. The catalog regression script is `supabase/tests/approved_member_access_contract.sql`; it checks policy/function definitions and RPC grants, but does not replace behavioral tests with real test identities.

## Expected access matrix

| Identity | Public articles/fiches | Member-only articles/fiches | Feature catalogue | Feature unlock |
|---|---|---|---|---|
| Anonymous | Published public only | Denied | No rows | Denied |
| Authenticated, pending/rejected | Published public only | Denied | No rows | Denied |
| Approved member, no grant/badge | Published public | Denied for feature-gated content; member visibility follows published visibility policy | Active rules/routes | Locked |
| Approved member with individual grant | Published public | Allowed for approved-member content | Active rules/routes | Allowed only for granted feature |
| Approved member with qualifying badge | Published public | Allowed only where the matching feature route grants access | Active rules/routes | Allowed only for the matching badge route |
| Admin | Allowed | Allowed | All active rules/routes | Allowed |

## SQL and behavioral checks

1. Run `supabase/tests/approved_member_access_contract.sql` after the migration. It must finish without raising an exception.
2. Inspect all policies for `public.blogs`, `public.topic`, `public.hn_access_rules`, `public.hn_access_routes`, and `public.hn_user_access` using `pg_policies`.
3. Remember that permissive RLS policies are OR-combined. It is not sufficient to add one restrictive-looking policy if another SELECT/ALL policy still exposes the same rows. The regression test checks every SELECT/ALL policy applying to `authenticated` and permits only an explicit admin gate or an approval gate.
4. Confirm `blogs_public_select` checks `profiles.application_status = 'approved'` for `access_level = 'members'`, while public published content remains readable.
5. Confirm `Members can view allowed topics` checks approval for both `members` and `approved_members`, while the separate anonymous public-topic policy remains unchanged.
6. Test `public.hn_has_access(text)` with pending/rejected identities that have a stale individual grant and a badge route. It must return false for both cases.
7. Test `public.hn_my_access()`: pending/rejected identities receive no rows; approved members receive active rules/routes; admins retain administrative access.
8. Confirm the public launch funnel and anonymous waitlist insert policy remain unchanged.
9. Confirm admins can still manage access rules/routes/grants using the existing admin RPCs.
10. Revoke a test user's feature grant and confirm access closes unless a valid badge route separately grants that same feature.
11. Check browser-facing flows for public articles/fiches, member-only articles/fiches, login, and manual approval.

## Rollout notes

- Do not treat frontend hiding as security. RLS and RPC checks must enforce access.
- The catalog regression script verifies the database contract, not full runtime behavior or all identity roles.
- Do not apply this migration directly to production until the SQL diff has been reviewed and the behavioral matrix above has been tested in a non-production environment.
- The Value Exchange Wall (contribution prompt, submission, immediate benefit, and unlock workflow) is separate product work. This migration secures the approval/access foundation; it does not claim to implement that workflow.
