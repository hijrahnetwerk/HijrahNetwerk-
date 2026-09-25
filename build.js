/**
 * HN build script
 * Werkt met Vercel én Netlify.
 *
 * Leest:
 * VITE_SUPABASE_URL
 * VITE_SUPABASE_ANON_KEY
 *
 * Maakt:
 * - assets/config.js
 * - robots.txt
 * - sitemap.xml
 *
 * De sitemap wordt bij elke productie-build opnieuw opgebouwd vanuit
 * de publiek leesbare HN-data, zodat nieuwe steden en publicaties
 * automatisch vindbaar worden.
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = 'https://hijrah-netwerk.vercel.app';

console.log('\n[HN build] Supabase configuratie controleren...');

if (!SUPABASE_URL) {
  console.error('[HN build] FOUT: VITE_SUPABASE_URL ontbreekt.');
  process.exit(1);
}
if (!SUPABASE_ANON_KEY) {
  console.error('[HN build] FOUT: VITE_SUPABASE_ANON_KEY ontbreekt.');
  process.exit(1);
}

const configContent = `// AUTOMATISCH GEGENEREERD DOOR build.js.
// NIET HANDMATIG BEWERKEN.

window.__ENV = {
  SUPABASE_URL: ${JSON.stringify(SUPABASE_URL)},
  SUPABASE_ANON_KEY: ${JSON.stringify(SUPABASE_ANON_KEY)}
};
`;

const assetsDir = path.join(__dirname, 'assets');
fs.mkdirSync(assetsDir, { recursive: true });
fs.writeFileSync(path.join(assetsDir, 'config.js'), configContent, 'utf8');

const translateTag = '<script src="/assets/hn-translate.js"></script>';
const translateStyleTag = '<link rel="stylesheet" href="/assets/hn-translate.css">';
const editProposalTag = '<script src="/assets/hn-edit-proposals.js"></script>';
const fontsTag = '<link rel="stylesheet" href="/assets/fonts.css">';

const htmlFiles = fs.readdirSync(__dirname).filter(name => name.endsWith('.html'));
let processed = 0;

for (const file of htmlFiles) {
  const filePath = path.join(__dirname, file);
  let html = fs.readFileSync(filePath, 'utf8');

  html = html.replace(/<script src="\/assets\/private-preview\.js"><\/script>\s*/g, '');

  if (!html.includes('</body>')) {
    console.warn('[HN build] Geen </body> gevonden in ' + file + '; pagina overgeslagen.');
    continue;
  }

  const additions = [
    !html.includes(translateTag) ? translateTag : '',
    !html.includes(translateStyleTag) ? translateStyleTag : '',
    !html.includes(editProposalTag) ? editProposalTag : '',
    !html.includes(fontsTag) ? fontsTag : ''
  ].filter(Boolean).join('\n') + '\n';

  html = html.replace('</body>', additions + '</body>');
  fs.writeFileSync(filePath, html, 'utf8');
  processed++;
}

function escXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchJson(table, query) {
  const url = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + table + '?' + query;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY
    }
  });
  if (!response.ok) {
    throw new Error(table + ' sitemap query failed: ' + response.status);
  }
  return response.json();
}

async function buildSitemap() {
  const staticRoutes = [
    '/',
    '/landen',
    '/navigatie',
    '/kennisbank',
    '/smart-search',
    '/community',
    '/bijdragen',
    '/orientatie',
    '/orientatietest',
    '/stappenplan',
    '/voorbereiding',
    '/vertrek',
    '/integratie',
    '/realiteitscheck',
    '/verhalen',
    '/stedengids',
    '/vergelijken',
    '/hulp'
  ];

  const urls = new Map();
  const add = (pathname, priority, changefreq) => {
    if (!pathname || pathname.includes('?')) return;
    const clean = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    urls.set(clean, { priority, changefreq });
  };

  staticRoutes.forEach(route => add(route, route === '/' ? '1.0' : '0.7', route === '/' ? 'weekly' : 'monthly'));

  try {
    const [countries, cities, topics] = await Promise.all([
      fetchJson('countries', 'select=slug,is_active&is_active=eq.true&order=name'),
      fetchJson('cities', 'select=slug,name,country_id,is_active&is_active=eq.true&order=name'),
      fetchJson(
        'topic',
        'select=slug,city_id,category_id,neighborhood,published,visibility,updated_at&published=eq.true&visibility=neq.private&order=updated_at.desc'
      )
    ]);

    const countryMap = new Map(countries.map(x => [x.slug || slugify(x.name), x]));
    const cityMap = new Map(cities.map(x => [x.country_id + ':' + (x.slug || slugify(x.name)), x]));
    const cityById = new Map(cities.map(x => [x.id, x]));

    cities.forEach(city => {
      const country = countryMap.get(city.country_id);
      const citySlug = city.slug || slugify(city.name);
      add('/stad/' + citySlug, '0.8', 'weekly');
    });

    const categories = await fetchJson('categories', 'select=id,slug,name,is_active&is_active=eq.true');
    const categoryById = new Map(categories.map(x => [x.id, x]));

    topics.forEach(topic => {
      const slug = topic.slug || '';
      if (!slug) return;

      const city = cityById.get(topic.city_id);
      const category = categoryById.get(topic.category_id);
      const categorySlug = category?.slug || slugify(category?.name || topic.visibility || 'informatie');

      if (city) {
        const citySlug = city.slug || slugify(city.name);
        const area = topic.neighborhood ? slugify(topic.neighborhood) : '';
        const parts = ['/locaties', citySlug];
        if (area) parts.push(area);
        parts.push(categorySlug, slug);
        add(parts.join('/'), '0.8', 'weekly');
      } else {
        add('/artikels/' + slug, '0.7', 'monthly');
      }
    });
  } catch (error) {
    console.warn('[HN build] Sitemap-data kon niet volledig worden geladen:', error.message);
  }

  const body = Array.from(urls.entries())
    .map(([loc, meta]) => {
      return [
        '  <url>',
        '    <loc>' + escXml(SITE_URL + loc) + '</loc>',
        '    <changefreq>' + meta.changefreq + '</changefreq>',
        '    <priority>' + meta.priority + '</priority>',
        '  </url>'
      ].join('\n');
    })
    .join('\n');

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body + '\n</urlset>\n';

  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), xml, 'utf8');

  const robots = [
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /admin',
    'Disallow: /werkruimte',
    'Disallow: /dashboard',
    'Disallow: /mijn-kaart',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /reset-password',
    'Disallow: /update-password',
    '',
    'Sitemap: ' + SITE_URL + '/sitemap.xml',
    ''
  ].join('\n');

  fs.writeFileSync(path.join(__dirname, 'robots.txt'), robots, 'utf8');
  console.log('[HN build] sitemap.xml: ' + urls.size + ' URL(s).');
}

buildSitemap()
  .catch(error => {
    console.warn('[HN build] Sitemap-build mislukt:', error.message);
  })
  .finally(() => {
    console.log('[HN build] ' + processed + ' HTML-pagina\'s gecontroleerd en productie-klaar gemaakt.');
    console.log('[HN build] assets/config.js succesvol aangemaakt.');
  });
