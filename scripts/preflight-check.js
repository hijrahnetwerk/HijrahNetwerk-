'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const ignored = new Set(['.git', 'node_modules', '.vercel']);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file); else files.push(file);
  }
}
walk(root);
const jsFiles = files.filter((file) => file.endsWith('.js'));
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const failures = [];
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push('JavaScript syntax: ' + path.relative(root, file) + '\n' + (result.stderr || result.stdout || 'syntax check failed'));
}
const staticExtensions = new Set(['.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.woff', '.woff2', '.ttf', '.ico', '.json', '.xml']);
for (const file of htmlFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(src|href)="([^"]+)"/gi)) {
    let url = match[2].trim();
    if (!url || url.includes('$' + '{') || url.startsWith('http:') || url.startsWith('https:') || url.startsWith('//') || url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#') || url.startsWith('javascript:')) continue;
    url = url.split(/[?#]/)[0];
    if (!staticExtensions.has(path.extname(url).toLowerCase())) continue;
    const resolved = url.startsWith('/') ? path.resolve(root, '.' + url) : path.resolve(path.dirname(file), url);
    if (resolved.startsWith(root) && !fs.existsSync(resolved)) failures.push('Missing local file: ' + path.relative(root, file) + ' -> ' + url);
  }
}
try { JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')); }
catch (error) { failures.push('Invalid vercel.json: ' + error.message); }

// Regression checks for the publication builder and strict admin-only copy protection.
function source(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}
const protection = source('copy-protection.js');
const buildSource = source('build.js');
const supabaseClientSource = source('supabase-client.js');
const adminBlogs = source('admin-blogs.html');
const adminDashboard = source('admin.html');
const editor = source('assets/hn-publication-editor.js');
const article = source('blog-artikel.html');
const privacy = source('privacy.html');
const articlePreview = source('assets/hn-article-draft-preview.js');
const vercel = JSON.parse(source('vercel.json'));
if (!buildSource.includes('function validateSupabaseUrl') ||
    !buildSource.includes('function validatePublicSupabaseKey') ||
    !buildSource.includes("payload.role !== 'anon'")) {
  failures.push('Build must validate the Supabase HTTPS URL and reject privileged browser keys.');
}
if (!supabaseClientSource.includes('new URL(env.SUPABASE_URL)') ||
    !supabaseClientSource.includes('parsed.origin') ||
    !supabaseClientSource.includes('payload.role !== \'anon\'')) {
  failures.push('Runtime Supabase client must validate URL and reject privileged browser keys.');
}
if (!protection.includes('client.rpc("is_admin")') || !protection.includes('result.data === true') || !protection.includes('allowAdmin()')) {
  failures.push('Copy protection must fail closed and only allow a confirmed admin role.');
}
if (!protection.includes('function hasStoredSession()') || !protection.includes('if (adminVerified || !hasStoredSession()) return;')) {
  failures.push('Copy protection must avoid loading the Supabase client for visitors without a saved session.');
}
if (!protection.includes('window.addEventListener("focus", verifyAdmin)') || !protection.includes('event.key === authStorageKey')) {
  failures.push('Copy protection must recheck admin access after session changes.');
}
if (!buildSource.includes('copyProtectionTag') || !buildSource.includes("html.replace('</head>', copyProtectionTag")) {
  failures.push('Build must inject copy protection into the head of every HTML page.');
}
if (!adminBlogs.includes('Toestemming geregistreerd (optioneel, geen publicatieblokkade)') || /Publiceren geblokkeerd|!\$\('fConsent'\)\.checked/.test(adminBlogs)) {
  failures.push('Consent must remain optional and must not block saving or publishing a story/interview/experience.');
}
for (const type of ['paragraph', 'heading', 'quote', 'callout', 'accordion', 'checklist', 'image', 'divider', 'budget']) {
  if (!editor.includes(type + ':')) failures.push('Publication editor missing block type: ' + type);
}
if (!article.includes('renderArticleBlocks(b.content_blocks,b.content)') || !article.includes('safeHttpUrl')) {
  failures.push('Public article page must render structured blocks and validate external URLs.');
}
if (!article.includes("db.rpc('hn_public_blog_member_teaser'") || article.includes("from('blog_member_teasers')")) {
  failures.push('Member article previews must use the restricted teaser RPC rather than a SECURITY DEFINER view.');
}
if (!vercel.rewrites?.some((rule) => rule.source === '/privacy' && rule.destination === '/privacy.html')) {
  failures.push('The public /privacy route must resolve to privacy.html.');
}
if (!privacy.includes('<h1>Privacybeleid</h1>') || !privacy.includes('Jouw rechten') || !privacy.includes('Cookies, lokale opslag en analyse')) {
  failures.push('The public privacy policy must include its main heading, data-subject rights, and storage/analytics disclosure.');
}
if (!adminBlogs.includes('id="btnFullPreview"') || !adminBlogs.includes('id="hnDraftPreviewContent"') || !adminBlogs.includes('/assets/hn-article-draft-preview.js')) {
  failures.push('Admin article editor must expose the full unsaved article preview.');
}
if (!articlePreview.includes('function openPreview') || !articlePreview.includes('initInteractions') || !articlePreview.includes('hn-preview-budget')) {
  failures.push('Draft preview must render the article blocks and wire its interactive controls.');
}
if (vercel.git?.deploymentEnabled?.['work/hn-publication-builder-20261012'] !== false) {
  failures.push('Vercel preview deployments must remain disabled for the publication-builder work branch.');
}
if (vercel.git?.deploymentEnabled?.['work/hn-agadir-interactive-preview-20261012'] !== false) {
  failures.push('Vercel preview deployments must remain disabled for the Agadir preview work branch.');
}
if (vercel.git?.deploymentEnabled?.['fix/admin-verhalen-editor-ux-20261012'] !== false) {
  failures.push('Vercel preview deployments must remain disabled for the admin story editor fix branch.');
}
if (vercel.git?.deploymentEnabled?.['fix/pagespeed-security-a11y-20261013'] !== false) {
  failures.push('Vercel preview deployments must remain disabled for the PageSpeed/security/accessibility work branch.');
}
if (vercel.git?.deploymentEnabled?.['fix/supabase-migration-history-20261019'] !== false) {
  failures.push('Vercel preview deployments must remain disabled for the Supabase migration-history/privacy fix branch.');
}
if (vercel.git?.deploymentEnabled?.['fix/site-audit-20261019'] !== false) {
  failures.push('Vercel preview deployments must remain disabled for the site audit fix branch.');
}
const globalHeaders = vercel.headers?.find((entry) => entry.source === '/(.*)')?.headers || [];
const headerValue = (key) => globalHeaders.find((entry) => entry.key.toLowerCase() === key.toLowerCase())?.value || '';
if (!headerValue('Content-Security-Policy-Report-Only').includes("require-trusted-types-for 'script'")) failures.push('CSP report-only must include Trusted Types monitoring before enforcement is considered.');
if (headerValue('Cross-Origin-Opener-Policy') !== 'same-origin-allow-popups') failures.push('COOP must preserve same-origin popup flows used by authentication.');
if (!headerValue('Strict-Transport-Security').includes('includeSubDomains')) failures.push('HSTS must retain the current includeSubDomains directive.');
if (!(adminDashboard.indexOf('id="hn-admin-layout-final-overrides"') > adminDashboard.indexOf('/assets/hn-sitewide.css?v=1')) ||
    !adminDashboard.includes('min-height:calc(100dvh - 3px)') ||
    !adminDashboard.includes('.layout > .hn-admin-sidebar') ||
    !adminDashboard.includes('overflow-x:auto;-webkit-overflow-scrolling:touch')) {
  failures.push('Admin layout must override shared sidebar height/position rules after shared stylesheets and keep narrow content/tables responsive.');
}
for (const relative of ['blog-artikel.html', 'kennisbank.html']) {
  if (/Kopieer link|Link kopiëren/i.test(source(relative))) failures.push('Public copy-link control must be absent from ' + relative);
}
console.log('HN preflight: ' + jsFiles.length + ' JavaScript files, ' + htmlFiles.length + ' HTML pages checked.');
if (failures.length) { console.error(failures.join('\n\n')); process.exitCode = 1; }
else console.log('HN preflight passed: no JavaScript syntax errors or missing static file references.');
