/**
 * HN build script
 * Productie-build voor Vercel.
 */

const fs = require('fs');
const path = require('path');

const envUrl = String(process.env.VITE_SUPABASE_URL || '').trim();
const envKey = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const configuredUrl = envUrl && envUrl !== 'test' ? envUrl : '';
const configuredKey = envKey && envKey !== 'test' ? envKey : '';
if (!configuredUrl || !configuredKey) {
  throw new Error('[HN build] VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY zijn verplicht. Geen fallback-credentials toegestaan.');
}

function validateSupabaseUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch (_) {
    throw new Error('[HN build] VITE_SUPABASE_URL is geen geldige URL.');
  }
  const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  const localHttp = parsed.protocol === 'http:' && localHost && !process.env.VERCEL;
  if (parsed.protocol !== 'https:' && !localHttp) {
    throw new Error('[HN build] VITE_SUPABASE_URL moet HTTPS gebruiken (behalve lokale ontwikkeling).');
  }
  if (!parsed.hostname || parsed.username || parsed.password || parsed.search || parsed.hash ||
      (parsed.pathname !== '' && parsed.pathname !== '/')) {
    throw new Error('[HN build] VITE_SUPABASE_URL moet de basis-URL zijn, zonder pad, login, query of hash.');
  }
  return parsed.origin;
}

function validatePublicSupabaseKey(value) {
  if (!value || /\s/.test(value) || /^sb_secret_/i.test(value)) {
    throw new Error('[HN build] VITE_SUPABASE_ANON_KEY moet een publieke anon/publishable key zijn; secret-keys zijn verboden.');
  }
  if (value.startsWith('sb_publishable_')) return value;
  const parts = value.split('.');
  if (parts.length !== 3) {
    throw new Error('[HN build] VITE_SUPABASE_ANON_KEY heeft geen herkend publiek key-formaat.');
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch (_) {
    throw new Error('[HN build] VITE_SUPABASE_ANON_KEY bevat geen geldige JWT-payload.');
  }
  if (payload.role !== 'anon') {
    throw new Error('[HN build] VITE_SUPABASE_ANON_KEY mag geen service_role- of andere geprivilegieerde key bevatten.');
  }
  return value;
}

const SUPABASE_URL = validateSupabaseUrl(configuredUrl);
const SUPABASE_ANON_KEY = validatePublicSupabaseKey(configuredKey);
const vercelProductionUrl = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
const configuredSiteUrl = String(process.env.HN_SITE_URL || '').trim();
const SITE_URL = (configuredSiteUrl || (vercelProductionUrl ? 'https://' + vercelProductionUrl : 'https://hijrah-netwerk.vercel.app')).replace(/\/$/, '');

console.log('\n[HN build] Supabase configuratie gecontroleerd.');
console.log('[HN build] Supabase configuratie aanwezig: true');

const configContent = `// AUTOMATISCH GEGENEREERD DOOR build.js.\n// NIET HANDMATIG BEWERKEN.\n\nwindow.__ENV = {\n  SUPABASE_URL: ${JSON.stringify(SUPABASE_URL)},\n  SUPABASE_ANON_KEY: ${JSON.stringify(SUPABASE_ANON_KEY)}\n};\n`;

const assetsDir = path.join(__dirname, 'assets');
fs.mkdirSync(assetsDir, { recursive: true });
fs.writeFileSync(path.join(assetsDir, 'config.js'), configContent, 'utf8');

function normalizeLegacyBrandColors(content) {
  return content
    .replace(/#674c2e/gi, '#684a25')
    .replace(/#dd842a/gi, '#df842c')
    .replace(/#d4af37/gi, '#c9a227')
    .replace(/#c6a15b/gi, '#c9a227')
    .replace(/#9b7735/gi, '#8a6a0a')
    .replace(/#e4ca84/gi, '#e6c766')
    .replace(/#d8b665/gi, '#e6c766')
    .replace(/#b58d3e|#b88c3e/gi, '#c9a227')
    .replace(/#ffe7b0/gi, '#e6c766')
    .replace(/#392a18|#382817/gi, '#4f3a23')
    .replace(/#27ae60/gi, '#4e7d4a')
    .replace(/#c0392b/gi, '#b23a2e')
    .replace(/#a55e16|#a85e1b|#8a4b15|#9a6a38/gi, '#a06020')
    .replace(/#f0d060|#f5e27a|#f5d991|#fff3a5/gi, '#e6c766')
    .replace(/rgba\(103,\s*76,\s*46,/gi, 'rgba(104,74,37,')
    .replace(/rgba\(198,\s*161,\s*91,/gi, 'rgba(201,162,39,')
    .replace(/rgba\(221,\s*132,\s*42,/gi, 'rgba(223,132,44,');
}

function normalizeDirectory(dir) {
  let changed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'vendor' || entry.name === 'fonts') continue;
      changed += normalizeDirectory(filePath);
      continue;
    }
    if (!/\.(?:css|js|svg\.txt)$/i.test(entry.name)) continue;
    const original = fs.readFileSync(filePath, 'utf8');
    const normalized = normalizeLegacyBrandColors(original);
    if (normalized !== original) {
      fs.writeFileSync(filePath, normalized, 'utf8');
      changed++;
    }
  }
  return changed;
}

let normalizedBrandFiles = normalizeDirectory(assetsDir);
for (const name of fs.readdirSync(__dirname)) {
  if (!/\.(?:css|js)$/i.test(name) || name === 'build.js') continue;
  const filePath = path.join(__dirname, name);
  const original = fs.readFileSync(filePath, 'utf8');
  const normalized = normalizeLegacyBrandColors(original);
  if (normalized !== original) {
    fs.writeFileSync(filePath, normalized, 'utf8');
    normalizedBrandFiles++;
  }
}
console.log('[HN build] Legacy merkkleuren genormaliseerd in ' + normalizedBrandFiles + ' assetbestand(en).');
// Compatibiliteit: bestaande pagina's laden nog /config.js. Genereer dit bestand
// met exact dezelfde productieconfiguratie zodat de placeholder nooit live wordt gebruikt.
fs.writeFileSync(path.join(__dirname, 'config.js'), configContent, 'utf8');

// ---------------------------------------------------------------------------
// PRESTATIES (HN): lokale libs/fonts, loader, resource-hints en versiecodes.
// ---------------------------------------------------------------------------
const crypto = require('crypto');
let SUPABASE_ORIGIN = '';
try { SUPABASE_ORIGIN = new URL(SUPABASE_URL).origin; } catch (e) { SUPABASE_ORIGIN = ''; }

// Global styling is consolidated in hn-sitewide.css. Page-specific CSS is no longer rewritten or expanded at build time.

// Bibliotheken die eerst van een CDN kwamen staan nu op onze eigen server (vast versienummer, jaar-lang cachebaar).
const VENDOR_REWRITES = [
  [/https:\/\/cdn\.jsdelivr\.net\/npm\/d3@7(?:\.\d+\.\d+)*(?:\/dist\/d3\.min\.js)?/g, '/assets/vendor/d3-7.9.0.min.js'],
  [/https:\/\/cdn\.jsdelivr\.net\/npm\/topojson-client@3(?:\.\d+\.\d+)*(?:\/dist\/topojson-client\.min\.js)?/g, '/assets/vendor/topojson-client-3.1.0.min.js'],
  [/https:\/\/cdn\.jsdelivr\.net\/npm\/world-atlas@2(?:\.\d+\.\d+)*\/countries-110m\.json/g, '/assets/vendor/world-atlas-2-countries-110m.json']
];

// Versiecode = hash van de bestandsinhoud. Daardoor mogen bestanden met ?v= een jaar gecachet worden
// (zie vercel.json) en komt een wijziging toch meteen aan.
const _hashCache = new Map();
function assetHash(urlPath) {
  if (_hashCache.has(urlPath)) return _hashCache.get(urlPath);
  let h = '';
  try { h = crypto.createHash('sha1').update(fs.readFileSync(path.join(__dirname, urlPath.replace(/^\//, '')))).digest('hex').slice(0, 10); } catch (e) { h = ''; }
  _hashCache.set(urlPath, h);
  return h;
}
function versionAssets(html) {
  return html.replace(/\b(href|src)=(["'])(\/assets\/[^"'?#]+\.(?:css|js)|\/(?:config|supabase-client|auth|site-app|copy-protection)\.js)(?:\?[^"']*)?\2/g,
    (m, attr, q, p) => { const h = assetHash(p); return h ? attr + '=' + q + p + '?v=' + h + q : m; });
}

// Kritieke loader (inline, ~1,5 KB): rendert vóór alle andere bestanden.
const _orbit = fs.readFileSync(path.join(assetsDir, 'hn-orbit.svg.txt'), 'utf8').trim();
const LOADER_CRITICAL_CSS = fs.readFileSync(path.join(assetsDir, 'hn-loader-critical.css'), 'utf8').replace(/\s*\n\s*/g, '');
const LOADER_CRITICAL_JS = fs.readFileSync(path.join(assetsDir, 'hn-loader-critical.js'), 'utf8')
  .replace('__ORBIT_SVG__', () => _orbit.replace(/\\/g, '\\\\').replace(/'/g, "\\'")).replace(/\n\s*/g, ' ');
const PERF_HINTS = [
  SUPABASE_ORIGIN ? '<link rel="preconnect" href="' + SUPABASE_ORIGIN + '" crossorigin>' : ''
].filter(Boolean).join('\n') + '\n';

const translateTag = '<script src="/assets/hn-translate.js"></script>';
const translateStyleTag = '<link rel="stylesheet" href="/assets/hn-translate.css">';
const editProposalTag = '<script src="/assets/hn-edit-proposals.js"></script>';
const designFontsTag = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Raleway:wght@400;500;600;700&display=swap">';
const sitewideStyleTag = '<link rel="stylesheet" href="/assets/hn-sitewide.css">';
const mobilePolishTag = '<link rel="stylesheet" href="/assets/hn-mobile-polish.css">';
const globalRuntimeTag = '<script src="/assets/hn-global-runtime.js"></script>';
const adminBarTag = '<script src="/assets/hn-admin-bar.js?v=20261013"></script>';
const adminBarStyleTag = '<link rel="stylesheet" href="/assets/hn-admin-bar.css?v=20261013">';
const footerTag = '<script src="/assets/hn-footer.js?v=20261013" defer></script>';
const privatePreviewTag = '<script src="/assets/private-preview.js" data-hn-private-preview></script>';
const backToTopStyleTag = '<link rel="stylesheet" href="/assets/hn-back-to-top.css?v=20261014">';
const backToTopTag = '<script src="/assets/hn-back-to-top.js?v=20261014" defer></script>';
const pageEngineTag = '<script src="/assets/hn-page-engine.js"></script>';
const visualEditorTag = '<script src="/assets/hn-visual-editor-runtime.js?v=20261018-dragdrop"></script>';
const motionTag = '<script src="/assets/hn-motion.js"></script>';
const copyProtectionTag = '<script src="/copy-protection.js?v=20261012-admin-only-copy2"></script>';
const supabaseUmdUrl = '/assets/vendor/supabase-js-2.117.3.umd.js'; // zelf gehost: geen extern domein, wel jaar-lang cachebaar
const supabaseBootstrapPages = new Set(['integratie.html','orientatie.html','vertrek.html','voorbereiding.html','orientatietest.html']);

// Altijd het echte HN-kleurenlogo gebruiken als favicon. De versieparameter
// voorkomt dat browsers een oude favicon uit cache blijven tonen.
const faviconPath = '/assets/favicon-64.png';
const faviconTag = '<link rel="icon" type="image/png" href="' + faviconPath + '">\n' +
  '<link rel="shortcut icon" type="image/png" href="' + faviconPath + '">\n' +
  '<link rel="apple-touch-icon" href="' + faviconPath + '">';

  const memberSurfacePages = new Set(['dashboard.html','mijn-badges.html','mijn-kaart.html','profiel.html','bijdragen.html']);
  const publicNavStyleTag = '<link rel="stylesheet" href="/assets/public-nav.css?v=20261011-1">';
  const publicNavScriptTag = '<script src="/assets/public-nav.js?v=20261011-1" defer></script>';
  const memberNavScriptTag = '<script src="/assets/hn-member-nav.js?v=20261011-dashboard-nav1" defer></script>';
  const adminNavScriptTag = '<script src="/assets/hn-admin-nav.js?v=20261011-1" defer></script>';

const htmlFiles = fs.readdirSync(__dirname).filter(name => name.endsWith('.html'));
let processed = 0;

for (const file of htmlFiles) {
  const filePath = path.join(__dirname, file);
  let html = fs.readFileSync(filePath, 'utf8');
  html = normalizeLegacyBrandColors(html);

  html = html.replace(/(href|src)=(['"])assets\//g, '$1=$2/assets/');
  for (const scriptName of ['supabase-client', 'auth', 'site-app']) {
    const scriptTags = [
      '<script src="' + scriptName + '.js"></script>',
      '<script src="./' + scriptName + '.js"></script>',
      '<script src="/' + scriptName + '.js"></script>'
    ];
    for (const tag of scriptTags) {
      html = html.replace(tag, '<script src="/' + scriptName + '.js"></script>');
    }
  }
  // Remove competing legacy global stylesheets from rendered pages.
  // hn-sitewide.css is canonical; mobile-polish remains for legacy admin/mobile layout fixes.
  html = html.replace(/<link\b(?=[^>]*\bhref=["'][^"']*(?:fonts\.css|hn-design\.css|hn-ux\.css|hn-global-responsive\.css|hn-visual-polish\.css|hn-consistency\.css|hn-cms-theme\.css|hn-design-system\.css)(?:\?[^"']*)?["'])[^>]*>\s*/gi, '');
  html = html.replace(/<link\b(?=[^>]*\bhref=["'][^"']*hn-sitewide\.css(?:\?[^"']*)?["'])[^>]*>\s*/gi, '');
  html = html.replace(/@import\s+url\(["']?\/assets\/(?:hn-design|hn-ux)\.css["']?\)\s*;?/gi, '');
  html = html.replace(/assets\/public-nav\.(css|js)(?:\?[^"\']*)?/g, 'assets/public-nav.$1?v=20261011-1');
  html = html.replace(/\/assets\/hn-footer\.js(?:\?[^"']*)?/g, '/assets/hn-footer.js?v=20261013');
  html = html.replace(/\/assets\/hn-passport\.js(?:\?[^"']*)?/g, '/assets/hn-passport.js?v=20261014');
  html = html.replace(/\/assets\/hn-admin-bar\.js(?:\?[^"']*)?/g, '/assets/hn-admin-bar.js?v=20261013');
  html = html.replace(/\/assets\/hn-admin-bar\.css(?:\?[^"']*)?/g, '/assets/hn-admin-bar.css?v=20261013');
  html = html.replace(/<script src=["']\/copy-protection\.js(?:\?[^"']*)?["']><\/script>/g, '');

  // Verwijder oude favicon-verwijzingen voordat de juiste HN-favicon opnieuw
  // wordt geplaatst. Hierdoor blijft een eerdere build niet naar een verkeerd
  // logo verwijzen.
  html = html.replace(/<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*>\s*/gi, '');
  html = html.replace(/<link[^>]+rel=["'](?:apple-touch-icon|shortcut icon|icon)["'][^>]*>\s*/gi, '');

  if (!html.includes('</body>')) {
    console.warn('[HN build] Geen </body> gevonden in ' + file + '; pagina overgeslagen.');
    continue;
  }

  // Alleen de funnelhomepage blijft publiek. Alle platformpagina's vereisen een ingelogde admin.
  // Login- en herstelpagina's blijven bereikbaar zodat de beheerder kan inloggen.
  if (file !== 'index.html' && !['login.html','reset-password.html','update-password.html'].includes(file) && !html.includes('data-hn-private-preview')) {
    html = html.replace('</head>', privatePreviewTag + '\n</head>');
  }

  // Kopieerbescherming wordt in de head gestart, vóórdat de pagina-inhoud interactief wordt.
  // Alleen een door Supabase bevestigde adminrol kan de bescherming opheffen.
  if (!html.includes(copyProtectionTag)) {
    html = html.replace('</head>', copyProtectionTag + '\n</head>');
  }

  // Favicon hoort in <head>. Eerder werd hij als onderdeel van de body-additions geplaatst,
  // waardoor browsers hem niet betrouwbaar als favicon oppikten.
  const hasFavicon = /<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*>/i.test(html);
  if (!hasFavicon) {
    html = html.replace('</head>', faviconTag + '\n</head>');
  }

  const isAdminSurface = file.startsWith('admin') || file.startsWith('werkruimte');
  const isMemberSurface = memberSurfacePages.has(file);

  // Houd één canonieke Google Fonts-request per pagina; de build voegt hieronder
  // de volledige HN-fontset toe en voorkomt zo dubbele stylesheets/preconnects.
  html = html.replace(/<link\b[^>]*fonts\.googleapis\.com[^>]*>\s*/gi, '');
  html = html.replace(/<link\b[^>]*fonts\.gstatic\.com[^>]*>\s*/gi, '');

  // Member pages use the persistent member sidebar, not the public site navbar.
  if (isMemberSurface && !html.includes('public-nav.css') && !html.includes('/assets/hn-member-nav.js')) {
    html = html.replace('</head>', publicNavStyleTag + '\n</head>');
  }

  // Keep every page usable on phones, including older pages without a viewport declaration.
  if (!/<meta\s+name=[\"']viewport[\"']/i.test(html)) {
    html = html.replace('</head>', '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>');
  }

  if (!isAdminSurface && !html.includes('/assets/hn-back-to-top.css?v=20261014')) {
    html = html.replace('</head>', backToTopStyleTag + '\n</head>');
  }

  const additionList = [
    isMemberSurface && !html.includes('/assets/hn-member-nav.js') && !html.includes('/assets/public-nav.js') ? publicNavScriptTag : '',
    isMemberSurface && !html.includes('/assets/hn-member-nav.js') ? memberNavScriptTag : '',
    isAdminSurface && file !== 'admin-cms.html' && !html.includes('/assets/hn-admin-nav.js') ? adminNavScriptTag : '',
    !html.includes(pageEngineTag) && file !== 'cms-page.html' && !file.startsWith('admin') && !file.startsWith('login') && !file.startsWith('register') && !file.startsWith('reset-password') && !file.startsWith('update-password') && !file.startsWith('dashboard') && !file.startsWith('werkruimte') ? pageEngineTag : '',
    !html.includes(visualEditorTag) && !file.startsWith('admin') && !file.startsWith('login') && !file.startsWith('register') && !file.startsWith('reset-password') && !file.startsWith('update-password') && !file.startsWith('dashboard') && !file.startsWith('werkruimte') ? visualEditorTag : '',
    !html.includes(translateTag) ? translateTag : '',
    !html.includes(translateStyleTag) ? translateStyleTag : '',
    !html.includes(editProposalTag) ? editProposalTag : '',
    !html.includes('fonts.googleapis.com/css2?family=Amiri') ? designFontsTag : '',
    !html.includes('/assets/hn-sitewide.css') ? sitewideStyleTag : '',
    !html.includes('/assets/hn-mobile-polish.css') ? mobilePolishTag : '',
    !html.includes(globalRuntimeTag) ? globalRuntimeTag : '',
    !html.includes('/assets/hn-admin-bar.js?v=20261013') ? adminBarTag : '',
    !html.includes('/assets/hn-admin-bar.css?v=20261013') ? adminBarStyleTag : '',
    !html.includes('/assets/hn-motion.js') ? motionTag : '',

    file !== 'index.html' && !html.includes('/assets/hn-footer.js') && !isAdminSurface && !['login.html','register.html','reset-password.html','update-password.html','dashboard.html','paspoort.html','mijn-kaart.html'].includes(file) ? footerTag : '',
    !isAdminSurface && !['login.html','register.html','reset-password.html','update-password.html','mijn-kaart.html'].includes(file) && !html.includes('/assets/hn-back-to-top.js?v=20261014') ? backToTopTag : ''
  ].filter(Boolean);
  if (!html.includes('/assets/hn-loader.css')) additionList.push('<link rel="stylesheet" href="/assets/hn-loader.css">');
  // Stijlen horen in de <head>: onderaan de <body> zorgden ze ervoor dat de pagina eerst ongestyled getekend werd en dan versprong.
  const headLinks = additionList.filter(t => /^<link\b/i.test(t));
  const additions = additionList.filter(t => !/^<link\b/i.test(t)).join('\n') + '\n';

  if (!html.includes('/assets/hn-safe-url.js')) {
    html = html.replace('</head>', '<script src="/assets/hn-safe-url.js"></script>\n</head>');
  }
  html = html.replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2(?:\.\d+\.\d+)*(?:\/dist\/umd\/supabase\.js)?/g, supabaseUmdUrl);
  VENDOR_REWRITES.forEach(([re, to]) => { html = html.replace(re, to); });

  if (supabaseBootstrapPages.has(file)) {
    const hasSupabaseClientScript = /<script\b[^>]*\bsrc=["'][^"']*supabase-client\.js(?:\?[^"']*)?["'][^>]*>/i.test(html);
    const hasSupabaseLibraryScript = /<script\b[^>]*\bsrc=["'][^"']*@supabase\/supabase-js/i.test(html);
    if (!hasSupabaseClientScript) {
      html = html.replace('</head>', '<script src="/assets/config.js"></script>\n<script src="' + supabaseUmdUrl + '"></script>\n<script src="/supabase-client.js"></script>\n</head>');
    } else if (!hasSupabaseLibraryScript) {
      html = html.replace('</head>', '<script src="' + supabaseUmdUrl + '"></script>\n</head>');
    }
  }

  const canonicalRoutes = {
    'index.html':'/', 'landen.html':'/landen', 'navigatie.html':'/navigatie',
    'kennisbank.html':'/kennisbank', 'smart-search.html':'/smart-search', 'community.html':'/community',
    'bijdragen.html':'/bijdragen', 'orientatie.html':'/orientatie', 'hijrahtools.html':'/hijrahtools', 'orientatietest.html':'/orientatietest',
    'stappenplan.html':'/stappenplan', 'voorbereiding.html':'/voorbereiding', 'vertrek.html':'/vertrek',
    'integratie.html':'/integratie', 'realiteitscheck.html':'/realiteitscheck', 'verhalen.html':'/verhalen',
    'stedengids.html':'/stedengids', 'vergelijken.html':'/vergelijken', 'hulp.html':'/hulp', 'auteursrecht.html':'/auteursrecht'
  };

  const noindexFiles = new Set(['admin-badges.html','login.html','register.html','reset-password.html','update-password.html','dashboard.html','mijn-kaart.html','paspoort.html','admin-paspoort.html','admin.html','admin-hulp.html','admin-kaart.html','admin-wachtlijst.html','admin-bewerkvoorstellen.html','werkruimte.html']);
  const canonicalRoute = canonicalRoutes[file];
  if (canonicalRoute && !html.includes('rel="canonical"')) {
    html = html.replace('</head>', '<link rel="canonical" href="' + SITE_URL + canonicalRoute + '">\n</head>');
  }

  if (canonicalRoute && !html.includes('property="og:title"')) {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g,'').trim() : 'Hijrah Netwerk';
    const description = descriptionMatch ? descriptionMatch[1].trim() : 'Hijrah Netwerk: praktische informatie en hulpmiddelen van oriëntatie tot integratie.';
    const social = '<meta property="og:type" content="website">\n<meta property="og:title" content="' + title.replace(/"/g,'&quot;') + '">\n<meta property="og:description" content="' + description.replace(/"/g,'&quot;') + '">\n<meta property="og:url" content="' + SITE_URL + canonicalRoute + '">\n<meta name="twitter:card" content="summary">\n<meta name="twitter:title" content="' + title.replace(/"/g,'&quot;') + '">\n<meta name="twitter:description" content="' + description.replace(/"/g,'&quot;') + '">';
    html = html.replace('</head>', social + '\n</head>');
  }

  if (file !== 'index.html') {
    const existingRobots = html.match(/<meta[^>]+name=["']robots["'][^>]*>/i);
    const tag = '<meta name="robots" content="noindex,nofollow">';
    if (existingRobots) html = html.replace(existingRobots[0], tag);
    else html = html.replace('</head>', tag + '\n</head>');
  }

  const perfHead = (html.includes('id="hn-loader-critical"') ? '' : '<style id="hn-loader-critical">' + LOADER_CRITICAL_CSS + '</style><script id="hn-loader-critical-js">' + LOADER_CRITICAL_JS + '</script>\n') + PERF_HINTS;
  html = html.replace(/<head(\s[^>]*)?>/i, (m) => m + '\n' + perfHead);
  if (headLinks.length) {
    const sharedLinks = headLinks.join('\n') + '\n';
    const tokenStart = html.indexOf('hn-tokens.css');
    const tokenEnd = tokenStart >= 0 ? html.indexOf('>', tokenStart) : -1;
    if (tokenEnd >= 0) {
      html = html.slice(0, tokenEnd + 1) + '\n' + sharedLinks + html.slice(tokenEnd + 1);
    } else {
      html = html.replace('</head>', sharedLinks + '</head>');
    }
  }
  if (!html.includes('/assets/hn-loader.js')) html = html.replace('</head>', () => '<script src="/assets/hn-loader.js" defer></script>\n</head>');
  html = html.replace('</body>', () => additions + '</body>');
  html = versionAssets(html);
  fs.writeFileSync(filePath, html, 'utf8');
  processed++;
}


/* Retire unused legacy global stylesheets from the production output.
   Preflight runs before this build step; rendered HTML has already had their links removed.
   Keep hn-mobile-polish.css for the remaining legacy admin/mobile compatibility rules. */
const retiredGlobalStylesheets = [
  'assets/fonts.css',
  'assets/hn-design.css',
  'assets/hn-ux.css',
  'assets/hn-global-responsive.css',
  'assets/hn-visual-polish.css',
  'assets/hn-consistency.css',
  'assets/hn-cms-theme.css'
];
for (const relativePath of retiredGlobalStylesheets) {
  try { fs.rmSync(path.join(__dirname, relativePath), { force: true }); }
  catch (error) { console.warn('[HN build] Legacy stylesheet kon niet worden verwijderd:', relativePath); }
}
console.log('[HN build] Eén centrale huisstijl geladen; oude globale CSS-bestanden uit productie-output verwijderd.');

function escXml(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
function slugify(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function publicSlug(value) { return String(value || '').replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, ''); }

async function fetchJson(table, query) {
  const url = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + table + '?' + query;
  const response = await fetch(url, {headers: {apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY}});
  if (!response.ok) throw new Error(table + ' sitemap query failed: ' + response.status);
  return response.json();
}

async function buildSitemap() {
  // Tijdens de pre-launch is uitsluitend de openbare funnelhomepage vindbaar.
  const staticRoutes = ['/'];
  const urls = new Map();
  const add = (pathname, priority, changefreq) => { if (!pathname || pathname.includes('?')) return; const clean = pathname === '/' ? '/' : pathname.replace(/\/$/, ''); urls.set(clean, {priority, changefreq}); };
  staticRoutes.forEach(route => add(route, route === '/' ? '1.0' : '0.7', route === '/' ? 'weekly' : 'monthly'));
  // Dynamische steden en fiches worden pas aan de sitemap toegevoegd na de publieke lancering.
  if (process.env.HN_PUBLIC_LAUNCH === 'true') {
    try {
      let cities = [], topics = [], categories = [];
      try { cities = await fetchJson('cities','select=id,slug,name,country_id,is_active&is_active=eq.true&order=name'); } catch (error) { console.warn('[HN build] Steden konden niet in sitemap worden geladen:', error.message); }
      try { topics = await fetchJson('topic','select=slug,city_id,category_id,neighborhood,published,visibility,updated_at&published=eq.true&order=updated_at.desc'); } catch (error) { console.warn('[HN build] Artikels/fiches konden niet in sitemap worden geladen:', error.message); }
      try { categories = await fetchJson('categories','select=id,slug,name,is_active&is_active=eq.true&order=name'); } catch (error) { console.warn('[HN build] Categorieën konden niet in sitemap worden geladen:', error.message); }
      const cityById = new Map(cities.map(x => [x.id, x]));
      cities.forEach(city => add('/stad/' + (city.slug || slugify(city.name)), '0.8', 'weekly'));
      const categoryById = new Map(categories.map(x => [x.id, x]));
      topics.forEach(topic => { const slug = publicSlug(topic.slug || ''); if (!slug) return; const city = cityById.get(topic.city_id); const category = categoryById.get(topic.category_id); const categorySlug = category?.slug || slugify(category?.name || topic.visibility || 'informatie'); if (city) { const citySlug = city.slug || slugify(city.name); const area = topic.neighborhood ? slugify(topic.neighborhood) : ''; const parts = ['/locaties', citySlug]; if (area) parts.push(area); parts.push(categorySlug, slug); add(parts.join('/'), '0.8', 'weekly'); } else add('/artikels/' + slug, '0.7', 'monthly'); });
    } catch (error) { console.warn('[HN build] Sitemap-data kon niet volledig worden geladen:', error.message); }
  }
  const body = Array.from(urls.entries()).map(([loc, meta]) => ['  <url>','    <loc>' + escXml(SITE_URL + loc) + '</loc>','    <changefreq>' + meta.changefreq + '</changefreq>','    <priority>' + meta.priority + '</priority>','  </url>'].join('\n')).join('\n');
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + '\n</urlset>\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, 'robots.txt'), [
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /admin',
    'Disallow: /admin-',
    'Disallow: /werkruimte',
    'Disallow: /dashboard',
    'Disallow: /mijn-kaart',
    'Disallow: /paspoort',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /reset-password',
    'Disallow: /update-password',
    '',
    'Sitemap: ' + SITE_URL + '/sitemap.xml',
    ''
  ].join('\n'), 'utf8');
  console.log('[HN build] sitemap.xml: ' + urls.size + ' URL(s).');
}

buildSitemap().catch(error => console.warn('[HN build] Sitemap-build mislukt:', error.message)).finally(() => {
  console.log('[HN build] ' + processed + ' HTML-pagina\'s gecontroleerd en productie-klaar gemaakt.');
  console.log('[HN build] assets/config.js succesvol aangemaakt.');
});
