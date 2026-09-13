/**
 * Minimale build-stap voor een statische site (geen Vite/webpack nodig).
 *
 * Netlify voert dit uit vóór elke deploy (zie netlify.toml: build.command).
 * Het script leest de environment variables die je in Netlify instelt
 * (Site settings → Environment variables) en schrijft ze naar assets/config.js,
 * zodat de statische HTML-pagina's ze kunnen gebruiken.
 *
 * Belangrijk: de Supabase ANON key is publiek/veilig om in de browser te staan
 * (bescherming gebeurt via Row Level Security in Supabase). Er wordt hier dus
 * NOOIT een service-role key of ander geheim gebruikt.
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '\n[build.js] FOUT: VITE_SUPABASE_URL en/of VITE_SUPABASE_ANON_KEY ontbreken.\n' +
    'Stel ze in via Netlify → Site settings → Environment variables, en trigger opnieuw een deploy.\n'
  );
  process.exit(1);
}

const configContent = `// AUTOMATISCH GEGENEREERD DOOR build.js — NIET HANDMATIG BEWERKEN.
// Wordt bij elke Netlify-deploy opnieuw geschreven op basis van de
// environment variables VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY.
window.__ENV = {
  SUPABASE_URL: ${JSON.stringify(SUPABASE_URL)},
  SUPABASE_ANON_KEY: ${JSON.stringify(SUPABASE_ANON_KEY)}
};
`;

const assetsDir = path.join(__dirname, 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

const outPath = path.join(assetsDir, 'config.js');
fs.writeFileSync(outPath, configContent, 'utf8');

console.log('[build.js] assets/config.js succesvol gegenereerd met Supabase-configuratie.');
