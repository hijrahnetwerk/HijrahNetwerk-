export const config = { runtime: 'edge' };

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function upsertMeta(html, kind, name, value) {
  const tag = '<meta ' + kind + '="' + name + '" content="' + escapeHtml(value) + '">';
  const pattern = new RegExp("<meta\\s+[^>]*" + kind + "=[\"']" + name + "[\"'][^>]*>", "i");
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', tag + '\n</head>');
}

function readConfigValue(source, key) {
  const pattern = new RegExp(key + ':\\s*("[^"]*")');
  const match = source.match(pattern);
  if (!match) return '';
  try { return JSON.parse(match[1]); } catch (_) { return ''; }
}

export default async function handler(request) {
  const requestUrl = new URL(request.url);
  const slug = String(requestUrl.searchParams.get('slug') || '').trim();
  const city = String(requestUrl.searchParams.get('city_slug') || '').trim();
  const area = String(requestUrl.searchParams.get('area_slug') || '').trim();
  const category = String(requestUrl.searchParams.get('category_slug') || '').trim();

  const pathParts = ['locaties', city, ...(area ? [area] : []), category, slug]
    .filter(Boolean)
    .map(part => encodeURIComponent(part));
  const canonicalUrl = new URL('/' + pathParts.join('/'), requestUrl.origin).toString();

  const templateResponse = await fetch(new URL('/fiche', requestUrl.origin));
  if (!templateResponse.ok) {
    return new Response('De fichepagina kon niet worden geladen.', {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  let html = await templateResponse.text();
  let title = 'Lokale informatie | Hijrah Netwerk';
  let description = 'Praktische lokale informatie over een plek, dienst of organisatie binnen Hijrah Netwerk.';
  let topic = null;

  if (slug) {
    try {
      const configResponse = await fetch(new URL('/assets/config.js', requestUrl.origin));
      const configSource = configResponse.ok ? await configResponse.text() : '';
      const envUrl = typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_URL : '';
      const envKey = typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_ANON_KEY : '';
      const supabaseUrl = envUrl || readConfigValue(configSource, 'SUPABASE_URL');
      const supabaseKey = envKey || readConfigValue(configSource, 'SUPABASE_ANON_KEY');

      if (supabaseUrl && supabaseKey) {
        const endpoint = new URL('/rest/v1/topic', supabaseUrl);
        endpoint.searchParams.set('slug', 'eq.' + slug);
        endpoint.searchParams.set('published', 'eq.true');
        endpoint.searchParams.set('select', 'title,summary,slug');
        endpoint.searchParams.set('limit', '1');
        const response = await fetch(endpoint, {
          headers: { apikey: supabaseKey, Authorization: 'Bearer ' + supabaseKey }
        });
        if (response.ok) {
          const rows = await response.json();
          topic = Array.isArray(rows) ? rows[0] || null : null;
        }
      }
    } catch (_) {
      topic = null;
    }
  }

  if (topic && topic.title) {
    title = String(topic.title) + ' | Hijrah Netwerk';
    description = String(topic.summary || ('Praktische informatie over ' + topic.title + ' via Hijrah Netwerk.'))
      .replace(/\s+/g, ' ').trim();
  }

  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(title) + '</title>');
  html = upsertMeta(html, 'name', 'description', description);
  html = upsertMeta(html, 'property', 'og:type', 'website');
  html = upsertMeta(html, 'property', 'og:title', title);
  html = upsertMeta(html, 'property', 'og:description', description);
  html = upsertMeta(html, 'property', 'og:url', canonicalUrl);
  html = upsertMeta(html, 'name', 'twitter:card', 'summary');
  html = upsertMeta(html, 'name', 'twitter:title', title);
  html = upsertMeta(html, 'name', 'twitter:description', description);

  const canonicalTag = '<link rel="canonical" href="' + escapeHtml(canonicalUrl) + '">';
  const canonicalPattern = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  html = canonicalPattern.test(html)
    ? html.replace(canonicalPattern, canonicalTag)
    : html.replace('</head>', canonicalTag + '\n</head>');

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
