/* HN private preview guard.
   During the pre-launch phase, every internal HN page is visible only to an HN admin.
   The public landing page (index.html) remains open. */
(function () {
  'use strict';

  if (window.__HN_PRIVATE_GUARD_RUNNING) return;
  window.__HN_PRIVATE_GUARD_RUNNING = true;

  var style = document.createElement('style');
  style.id = 'hn-private-guard-style';
  style.textContent = 'html{visibility:hidden!important}';
  document.head.appendChild(style);

  function reveal() {
    var s = document.getElementById('hn-private-guard-style');
    if (s) s.remove();
  }

  function deny() {
    window.location.replace('/');
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        if (window.supabase || window.hijrahSupabase) resolve();
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function getClient() {
    if (window.hijrahSupabase) return window.hijrahSupabase;

    if (!window.__ENV || !window.__ENV.SUPABASE_URL || !window.__ENV.SUPABASE_ANON_KEY) {
      await loadScript('/assets/config.js');
    }

    if (!window.supabase || !window.supabase.createClient) {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    }

    if (!window.hijrahSupabase && window.supabase && window.supabase.createClient) {
      window.hijrahSupabase = window.supabase.createClient(
        window.__ENV.SUPABASE_URL,
        window.__ENV.SUPABASE_ANON_KEY,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
      );
    }

    return window.hijrahSupabase;
  }

  async function check() {
    try {
      var db = await getClient();
      if (!db) return deny();

      var result = await db.auth.getUser();
      var user = result && result.data ? result.data.user : null;
      if (!user) return deny();

      var profileResult = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileResult.error || !profileResult.data || profileResult.data.role !== 'admin') {
        return deny();
      }

      reveal();
    } catch (e) {
      console.error('[HN] Private preview toegang geweigerd.', e);
      deny();
    }
  }

  check();
})();