/**
 * Echte Supabase Auth-helpers. Geen mock, geen localStorage-login.
 * Alle functies gebruiken de officiële supabase-js client (window.hijrahSupabase).
 */

async function hnSignUp(email, password) {
  const { data, error } = await window.hijrahSupabase.auth.signUp({
    email,
    password,
    options: {
      // Waar de gebruiker terechtkomt na het klikken op de bevestigingsmail
      emailRedirectTo: window.location.origin + '/login.html'
    }
  });
  return { data, error };
}

async function hnSignIn(email, password) {
  const { data, error } = await window.hijrahSupabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

async function hnSignOut() {
  const { error } = await window.hijrahSupabase.auth.signOut();
  return { error };
}

async function hnGetSession() {
  const { data, error } = await window.hijrahSupabase.auth.getSession();
  return { session: data?.session || null, error };
}

async function hnRequestPasswordReset(email) {
  const { data, error } = await window.hijrahSupabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/update-password.html'
  });
  return { data, error };
}

async function hnUpdatePassword(newPassword) {
  const { data, error } = await window.hijrahSupabase.auth.updateUser({
    password: newPassword
  });
  return { data, error };
}

/** Vertaalt veelvoorkomende Supabase-foutmeldingen naar begrijpelijk Nederlands. */
function hnFriendlyError(error) {
  if (!error) return '';
  const msg = (error.message || '').toLowerCase();

  if (msg.includes('invalid login credentials')) {
    return 'E-mailadres of wachtwoord is onjuist.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'Er bestaat al een account met dit e-mailadres. Probeer in te loggen.';
  }
  if (msg.includes('password should be at least')) {
    return 'Je wachtwoord moet minstens 6 tekens lang zijn.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Bevestig eerst je e-mailadres via de link die we je stuurden, voor je inlogt.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Te veel pogingen. Probeer het over een paar minuten opnieuw.';
  }
  return error.message || 'Er ging iets mis. Probeer het opnieuw.';
}
