/**
 * Wordt geladen op index.html (de publieke homepage).
 * Checkt de echte Supabase-sessie en past "Inloggen" aan naar "Mijn dashboard"
 * wanneer iemand al ingelogd is. Verandert verder niets aan het bestaande design.
 */
(async function () {
  const { session } = await hnGetSession();

  const loginLinks = document.querySelectorAll('a[href="/login"]');
  const registerLinks = document.querySelectorAll('a[href="/register"]');

  if (session && session.user) {
    loginLinks.forEach(function (a) {
      a.textContent = 'Mijn dashboard';
      a.setAttribute('href', '/dashboard');
    });
    registerLinks.forEach(function (a) {
      a.style.display = 'none';
    });
  }

  // Reageer ook live op login/logout in een ander tabblad
  window.hijrahSupabase.auth.onAuthStateChange(function (_event, _session) {
    // Eenvoudig: herlaad de linkstatus door de pagina te verversen is te grof,
    // dus laten we de huidige staat gewoon staan tot een volgende paginalaad.
  });
})();
