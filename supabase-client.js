/**
 * Supabase client — gedeeld door alle pagina's.
 *
 * Verwacht dat assets/config.js AL geladen is.
 * Daarin staat:
 * window.__ENV = {
 *   SUPABASE_URL,
 *   SUPABASE_ANON_KEY
 * }
 */

(function () {
  const env = window.__ENV || {};

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error(
      '[Hijrah Netwerk] Supabase-configuratie ontbreekt. ' +
      'Controleer de Vercel Environment Variables en de build.'
    );
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.error(
      '[Hijrah Netwerk] Supabase library is niet geladen.'
    );
    return;
  }

  const client = window.supabase.createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  window.hijrahSupabase = client;

  console.log('[Hijrah Netwerk] Supabase client geladen.');
})();
