/**
 * Supabase client — gedeeld door alle pagina's.
 *
 * Verwacht dat assets/config.js AL geladen is (via <script src="assets/config.js">)
 * en window.__ENV = { SUPABASE_URL, SUPABASE_ANON_KEY } heeft gezet.
 *
 * config.js wordt automatisch gegenereerd door build.js op basis van de
 * Netlify environment variables VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY.
 * Bewerk config.js dus NOOIT rechtstreeks — die wijzigingen verdwijnen bij de
 * volgende deploy.
 */
(function () {
  const env = window.__ENV || {};

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error(
      '[Hijrah Netwerk] Supabase-configuratie ontbreekt. Controleer of ' +
      'VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY zijn ingesteld in Netlify ' +
      '(Site settings → Environment variables) en of de build opnieuw is uitgevoerd.'
    );
  }

  // supabase-js UMD build (via CDN in elke pagina) zet window.supabase beschikbaar
  // als factory. We hergebruiken die naam daarna voor de echte client-instantie.
  const client = window.supabase.createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,      // sessie bewaren na refresh
      autoRefreshToken: true,
      detectSessionInUrl: true   // nodig voor wachtwoord-reset links
    }
  });

  window.hijrahSupabase = client;
})();
