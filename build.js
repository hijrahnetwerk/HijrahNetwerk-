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

fs.mkdirSync(assetsDir, {
  recursive: true
});

const outPath = path.join(
  assetsDir,
  'config.js'
);

fs.writeFileSync(
  outPath,
  configContent,
  'utf8'
);

console.log(
  '[HN build] assets/config.js succesvol aangemaakt.'
);
