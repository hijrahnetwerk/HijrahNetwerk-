/**
 * HN build script
 * Werkt met Vercel én Netlify.
 *
 * Leest:
 * VITE_SUPABASE_URL
 * VITE_SUPABASE_ANON_KEY
 *
 * en maakt:
 * assets/config.js
 *
 * Pre-launch:
 * Alle interne HTML-pagina's krijgen automatisch een admin-only guard.
 * index.html, login/register en password-recovery blijven publiek toegankelijk.
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n[HN build] Supabase configuratie controleren...');

if (!SUPABASE_URL) {
  console.error('[HN build] FOUT: VITE_SUPABASE_URL ontbreekt.');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('[HN build] FOUT: VITE_SUPABASE_ANON_KEY ontbreekt.');
  process.exit(1);
}

console.log('[HN build] SUPABASE_URL: aanwezig');
console.log('[HN build] SUPABASE_ANON_KEY: aanwezig');

const configContent = `// AUTOMATISCH GEGENEREERD DOOR build.js.
// NIET HANDMATIG BEWERKEN.

window.__ENV = {
  SUPABASE_URL: ${JSON.stringify(SUPABASE_URL)},
  SUPABASE_ANON_KEY: ${JSON.stringify(SUPABASE_ANON_KEY)}
};
`;

const assetsDir = path.join(__dirname, 'assets');

fs.mkdirSync(assetsDir, { recursive: true });

const outPath = path.join(assetsDir, 'config.js');

fs.writeFileSync(outPath, configContent, 'utf8');

const guardTag = '<script src="/assets/private-preview.js"></script>';
const translateTag = '<script src="/assets/hn-translate.js"></script>';
const translateStyleTag = '<link rel="stylesheet" href="/assets/hn-translate.css">';
const editProposalTag = '<script src="/assets/hn-edit-proposals.js"></script>';
const fontsTag = '<link rel="stylesheet" href="/assets/fonts.css">';
const publicPages = new Set([
  'index.html',
  'login.html',
  'register.html',
  'reset-password.html',
  'update-password.html'
]);

const htmlFiles = fs.readdirSync(__dirname)
  .filter(name => name.endsWith('.html') && !publicPages.has(name));

let guarded = 0;

for (const file of htmlFiles) {
  const filePath = path.join(__dirname, file);
  let html = fs.readFileSync(filePath, 'utf8');

  if (html.includes(translateTag) && html.includes(editProposalTag) && html.includes(fontsTag)) continue;

  const marker = '</body>';
  if (!html.includes(marker)) {
    console.warn('[HN build] Geen </body> gevonden in ' + file + '; guard niet toegevoegd.');
    continue;
  }

  const additions = [
    !publicPages.has(file) && !html.includes(guardTag) ? guardTag : '',
    !html.includes(translateTag) ? translateTag : '',
    !html.includes(translateStyleTag) ? translateStyleTag : '',
    !html.includes(editProposalTag) ? editProposalTag : '',
    !html.includes(fontsTag) ? fontsTag : ''
  ].filter(Boolean).join('\n') + '\n';
  html = html.replace(marker, additions + marker);
  fs.writeFileSync(filePath, html, 'utf8');
  guarded++;
}

console.log('[HN build] Private preview guard toegevoegd aan ' + guarded + ' interne pagina\'s.');
console.log('[HN build] assets/config.js succesvol aangemaakt.');
