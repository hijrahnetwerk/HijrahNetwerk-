# Hijrah Netwerk — Next.js / Cloudflare migratie

## Doel
De bestaande HN-site wordt gecontroleerd gemigreerd van statische HTML/CSS/JavaScript naar Next.js 16 + React + TypeScript, met de bestaande Supabase PostgreSQL/Auth/Storage/RLS als backend, Cloudflare Workers als hosting/runtime en GitHub als bron.

De architectuur blijft provider-portable. HN mag niet afhankelijk worden van Vercel-specifieke runtime-API's of Cloudflare-specifieke databronnen.

## Regels
1. Productie blijft op de huidige deployment totdat de volledige migratie is getest.
2. Geen tussentijdse productie-deployments.
3. Eerst migreren, daarna security-audit, daarna functionele/SEO/mobile tests, daarna één finale deployment.
4. Bestaande Supabase-data wordt niet vervangen of opnieuw opgebouwd zonder expliciete controle.
5. Alles wat HN beheersbaar maakt, moet uiteindelijk ook via HN-admin beheersbaar zijn.
6. Geen secrets in clientcode, HTML, publieke GitHub-bestanden of browserbundles.
7. Bestaande routes, redirects, canonical URLs en noindex-regels behouden of bewust opnieuw modelleren.
8. De huidige site blijft de functionele referentie tijdens de migratie.

## Volgorde
Fase 0: volledige inventarisatie van pagina's, assets, routes, Supabase-tabellen/RPC's/RLS, auth, admin en Vercel-specifieke code.

Fase 1: Next.js App Router, TypeScript, gedeelde HN layout/navigation, Supabase clients, Cloudflare/OpenNext buildlaag, environment contract, error/not-found/loading boundaries en provider-portable abstractions.

Fase 2: publieke HN-routes één voor één migreren zonder inhoudsverlies: /, /landen, /navigatie, /kennisbank, /smart-search, /community, /bijdragen, /orientatie, /orientatietest, /stappenplan, /voorbereiding, /vertrek, /integratie, /realiteitscheck, /verhalen, /stedengids, /vergelijken, /hulp en dynamische stad-, locatie-, fiche- en artikelroutes.

Fase 3: auth en leden: login/register/password recovery, profiel, Mijn Hijrah, dashboard, persoonlijke data, saved items, progressie, badges/stempels en bijdragen.

Fase 4: HN-admin volledig opnieuw opbouwen als consistente beheerlaag. Geen beheersbare functie blijft uitsluitend frontend-code.

Fase 5: security: RLS/policies, admin RPC's, PII-toegang, storage policies, secret boundaries, auth/session flow, leaked-password protection, CSP/security headers, XSS/open redirects/unsafe HTML.

Fase 6: kwaliteit: TypeScript/build, tests, mobile/responsive, accessibility, SEO/canonical/robots/sitemap, performance, Cloudflare Workers preview en recovery vanaf GitHub + Supabase backups.

Fase 7: één finale productie-deployment, gevolgd door smoke tests en pas daarna uitfaseren van de oude deployment.

## Huidige status
Deze branch is alleen de nieuwe technische basis. Er is nog geen productie-deployment uitgevoerd. De huidige Vercel-productie blijft de referentie.
