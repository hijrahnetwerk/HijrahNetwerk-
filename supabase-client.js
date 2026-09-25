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
  const configError = message => {
    console.error('[Hijrah Netwerk] ' + message);
    window.hijrahSupabaseError = message;
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY ||
      env.SUPABASE_URL === 'test' || env.SUPABASE_ANON_KEY === 'test') {
    configError('Supabase-configuratie ontbreekt of is ongeldig. Controleer de build/configuratie.');
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    configError('De Supabase-library is niet geladen. Controleer de scriptvolgorde of netwerkverbinding.');
    return;
  }

  try {
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
  } catch (error) {
    configError('Supabase kon niet worden geïnitialiseerd: ' + (error && error.message ? error.message : 'onbekende fout'));
  }
})();
