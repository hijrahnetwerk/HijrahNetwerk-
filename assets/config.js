// assets/config.js — doorverwijzing naar root config.js
// build.js schrijft window.__ENV naar /config.js (root)
// Deze stub zorgt dat pagina's die assets/config.js laden niet crashen
// De echte waarden worden geladen via /config.js in de <head>
// Alle pagina's moeten BEIDE laden: eerst /config.js dan /supabase-client.js
if (!window.__ENV) {
  // Probeer root config te laden als fallback
  (function() {
    var s = document.createElement('script');
    s.src = '/config.js';
    s.onerror = function() {
      console.error('[HN] config.js kon niet worden geladen vanuit assets/config.js fallback');
    };
    document.head.appendChild(s);
  })();
}
