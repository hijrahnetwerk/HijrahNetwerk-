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

  let validatedUrl;
  try {
    const parsed = new URL(env.SUPABASE_URL);
    const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    const localHttp = parsed.protocol === 'http:' && localHost;
    if ((parsed.protocol !== 'https:' && !localHttp) || !parsed.hostname ||
        parsed.username || parsed.password || parsed.search || parsed.hash ||
        (parsed.pathname !== '' && parsed.pathname !== '/')) {
      throw new Error('Gebruik een geldige HTTPS-basis-URL zonder pad of extra parameters.');
    }
    if (/^sb_secret_/i.test(env.SUPABASE_ANON_KEY)) {
      throw new Error('Een secret-key mag nooit in de browser worden gebruikt.');
    }
    if (env.SUPABASE_ANON_KEY.includes('.')) {
      const parts = env.SUPABASE_ANON_KEY.split('.');
      if (parts.length !== 3) throw new Error('De publieke Supabase-key heeft een ongeldig JWT-formaat.');
      let payload;
      try {
        const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        payload = JSON.parse(atob(encoded + '='.repeat((4 - encoded.length % 4) % 4)));
      } catch (_) { throw new Error('De publieke Supabase-key bevat een ongeldige JWT-payload.'); }
      if (payload.role !== 'anon') throw new Error('Een service_role-key mag nooit in de browser worden gebruikt.');
    } else if (!env.SUPABASE_ANON_KEY.startsWith('sb_publishable_')) {
      throw new Error('Gebruik een publieke anon- of publishable-key.');
    }
    validatedUrl = parsed.origin;
  } catch (error) {
    configError('Supabase-configuratie ongeldig: ' + (error && error.message ? error.message : 'controle mislukt'));
    return;
  }

  try {
    const client = window.supabase.createClient(
      validatedUrl,
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
    // Supabase client geladen (log verwijderd in productie)
  } catch (error) {
    configError('Supabase kon niet worden geïnitialiseerd: ' + (error && error.message ? error.message : 'onbekende fout'));
  }
})();
