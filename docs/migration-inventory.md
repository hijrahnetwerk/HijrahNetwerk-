# HN migration inventory

## Current source
Repository: hijrahnetwerk/HijrahNetwerk-
Current production baseline: Vercel
Current architecture: static HTML/CSS/JavaScript + node build.js + Supabase

## Findings
- No Next.js dependency existed on main.
- No React dependency existed on main.
- package.json only contained Vercel Analytics and Speed Insights.
- build.js generated browser-side Supabase configuration from VITE_SUPABASE_* variables.
- The current site has many direct browser Supabase calls.
- Auth is implemented in auth.js and related browser scripts.
- Admin functionality is spread across multiple HTML pages and assets.
- Supabase migrations are already substantial and contain RLS, admin checks, CMS/workspace, profile security, badges/rewards and search hardening.
- Vercel-specific routing and security headers live in vercel.json.
- The current build script also generates sitemap.xml and robots.txt from Supabase data.

## Migration risks that must be handled
1. Route parity: existing clean URLs currently depend on Vercel rewrites.
2. Dynamic content: article, fiche, city and location routes must become real Next.js dynamic routes.
3. Auth/session behavior: browser Supabase Auth must be migrated without weakening RLS.
4. Admin authorization: frontend hiding is never a security boundary; database RLS/RPC authorization remains authoritative.
5. Unsafe HTML: existing innerHTML usage must be reviewed before moving content into React.
6. Runtime config: public Supabase URL/anon key may be client-visible; service-role and AI secrets must remain server-only.
7. Sitemap/robots: build-time generation must be replaced with Next.js metadata/routes or a controlled server/build process.
8. Vercel-only code: @vercel/analytics, @vercel/speed-insights, VERCEL_* variables and vercel.json routing need replacement.
9. Cloudflare compatibility: Next.js features used by HN must be checked against the chosen Cloudflare adapter before production.
10. Admin completeness: every migrated manageable feature must have an HN-admin control path.

## Existing route families to preserve
Public: /, /landen, /navigatie, /kennisbank, /smart-search, /community, /bijdragen, /orientatie, /orientatietest, /stappenplan, /voorbereiding, /vertrek, /integratie, /realiteitscheck, /verhalen, /stedengids, /vergelijken, /hulp, /auteursrecht

Member/private: /dashboard, /mijn-kaart, /profiel, /login, /register, /reset-password, /update-password

Admin/workspace: /admin, /admin-beloningen, /admin-componenten, /admin-hulp, /admin-kaart, /admin-navigation, /admin-profielen, /admin-wachtlijst, /admin-bewerkvoorstellen, /admin-builder, /admin-cms, /werkruimte

Dynamic: /stad/:slug, /fiche/:slug, /artikels/:slug, /locaties/:city/:category/:slug, /locaties/:city/:area/:category/:slug, /pagina/:slug

## Do not remove yet
The legacy HTML/JS implementation remains the reference until equivalent Next.js routes and functionality have been tested. No production deployment should point to this branch yet.
