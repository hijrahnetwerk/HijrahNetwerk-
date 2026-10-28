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
const adminCmsPage = source('admin-cms.html');
const adminCmsScript = source('assets/admin-cms.js');
const registration = source('register.html');
const myHijrah = source('mijn-hijrah.html');
const footer = source('assets/hn-footer.js');
const passport = source('paspoort.html');
const authStyles = source('auth-style.css');
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
if (!privacy.includes("eq(\"key\", \"privacy_contact\")") ||
    !privacy.includes("responsible_name") || !privacy.includes("privacy_email") ||
    !adminCmsPage.includes('id="privacyResponsibleName"') ||
    !adminCmsPage.includes('id="privacyEmail"') ||
    !adminCmsPage.includes('id="privacyPostalAddress"') ||
    !adminCmsPage.includes('id="savePrivacySettings"') ||
    !adminCmsScript.includes("upsert({ key: 'privacy_contact', value: value }")) {
  failures.push('Privacy contact details must be editable in HN Beheer and rendered from the public privacy_contact setting.');
}
// Navigation regression checks: custom HN Beheer and member surfaces must not receive a second global navigation.
if (!buildSource.includes("file !== 'admin-cms.html'") ||
    !buildSource.includes("!html.includes('/assets/hn-member-nav.js') && !html.includes('/assets/public-nav.js')")) {
  failures.push('Custom admin and member layouts must not receive duplicate global navigation menus.');
}
if (adminCmsPage.includes('class="tools-section"') ||
    adminCmsPage.includes('/assets/hn-footer.js')) {
  failures.push('HN Beheer must not repeat sidebar links in a second tools menu or inject the public multi-column footer.');
}
// HN Beheercentrum: list-first, responsive, searchable admin experience; no embedded full-page previews.
if (!adminCmsPage.includes('id="pageTableBody"') ||
    !adminCmsPage.includes('id="pageSearch"') ||
    !adminCmsPage.includes('data-status="published"') ||
    !adminCmsPage.includes('id="pageSort"') ||
    !adminCmsPage.includes('id="mobileMenu"') ||
    adminCmsPage.includes('<iframe')) {
  failures.push('HN Beheercentrum must use a responsive page list with search/status filters and no large iframe previews.');
}
if (!adminCmsScript.includes("function esc(") ||
    !adminCmsScript.includes("encodeURIComponent(slug)") ||
    !adminCmsScript.includes("function render") ||
    !adminCmsScript.includes("ctrlKey||e.metaKey") ||
    !adminCmsScript.includes("upsert({ key: 'privacy_contact', value: value }")) {
  failures.push('HN Beheercentrum must escape database content, support page-list interactions, and preserve privacy settings saving.');
}
if (!registration.includes('De community gaat stap voor stap open') || !registration.includes('/#inschrijven')) {
  failures.push('Registration must remain closed and direct new users to the launch waitlist.');
}
if (/auth\.signUp|\bsignUp\s*\(/i.test(registration) || /<form\b/i.test(registration)) {
  failures.push('Registration must not expose an account-creation form or call Supabase signUp while the community is closed.');
}
if (!myHijrah.includes('href="/#inschrijven">Aanmelden voor de wachtlijst</a>') || myHijrah.includes('href="/register">Account aanvragen')) {
  failures.push('The Mijn Hijrah logged-out CTA must point to the waitlist while registration is closed.');
}
if (!footer.includes('href="/#inschrijven">Wachtlijst voor de community</a>') || footer.includes('href="/register">Aanmelden</a>')) {
  failures.push('The public footer must not imply that community account registration is open.');
}
if (!passport.includes('.bk{grid-template-columns:minmax(0,1fr)}') || !passport.includes('@media(max-width:380px)') || !passport.includes('.stp svg{width:min(100%,96px);height:auto}')) {
  failures.push('HN Paspoort must include narrow-screen layout rules for page cards and stamps.');
}
if (!authStyles.includes('linear-gradient(135deg,var(--brown),var(--orange))') || !authStyles.includes('@media(max-width:360px)')) {
  failures.push('Authentication pages must keep the brand mark valid and include narrow-screen styles.');
}
if (!myHijrah.includes('@media(max-width:420px)') || !myHijrah.includes('.action .button{width:100%;min-height:46px}')) {
  failures.push('Mijn Hijrah action buttons must remain touch-friendly on narrow screens.');
}
const mobilePolish = source('assets/hn-mobile-polish.css');
if (!mobilePolish.includes('.layout:has(> .sidebar)') ||
    !mobilePolish.includes('.builder-layout .page-panel') ||
    !mobilePolish.includes('@media (max-width: 380px)') ||
    !mobilePolish.includes('env(safe-area-inset-bottom')) {
  failures.push('Global mobile hardening must cover legacy admin layouts, the page builder, narrow phones, and safe-area insets.');
}
if (!mobilePolish.includes('body .layout:has(') ||
    !mobilePolish.includes('.sidebar) > .sidebar') ||
    !mobilePolish.includes('.sidebar) > .main') ||
    !mobilePolish.includes('body .shell:has(') ||
    !mobilePolish.includes('.side) > .side') ||
    !mobilePolish.includes('.side) > main') ||
    !mobilePolish.includes('.sidebar) .cards') ||
    !mobilePolish.includes('.side) .cards')) {
  failures.push('Legacy admin dashboard and workspace must explicitly collapse their own flex shells and card grids on mobile without affecting unrelated layouts.');
}
if (!buildSource.includes("const mobilePolishTag = '<link rel=\"stylesheet\" href=\"/assets/hn-mobile-polish.css\">';") ||
    !buildSource.includes("!html.includes('/assets/hn-mobile-polish.css') ? mobilePolishTag : ''")) {
  failures.push('Build must inject one cache-hashed mobile stylesheet per page without duplicate stale-version links.');
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
const unifiedUiCss = fs.readFileSync(path.join(root, 'assets/hn-sitewide.css'), 'utf8');
const builderUiCss = fs.readFileSync(path.join(root, 'assets/admin-builder.css'), 'utf8');
const builderHtml = fs.readFileSync(path.join(root, 'admin-builder.html'), 'utf8');
const buildScript = fs.readFileSync(path.join(root, 'build.js'), 'utf8');
if (!unifiedUiCss.includes('HN SITEWIDE CSS') || !unifiedUiCss.includes('--hn-br-donker') || !unifiedUiCss.includes('prefers-reduced-motion') || !unifiedUiCss.includes(':focus-visible')) {
  failures.push('Canonical HN sitewide design layer must retain the definitive tokens, keyboard focus states and reduced-motion support.');
}
if (!buildScript.includes('hn-sitewide.css') || !buildScript.includes('hn-mobile-polish.css') ||
    !buildScript.includes('hn-visual-polish\\\\.css') || !buildScript.includes('hn-consistency\\\\.css') ||
    !buildScript.includes('hn-cms-theme\\\\.css') || !buildScript.includes('hn-design-system\\\\.css')) {
  failures.push('Build must load the canonical sitewide CSS and strip competing legacy global stylesheets.');
}
console.log('HN preflight: ' + jsFiles.length + ' JavaScript files, ' + htmlFiles.length + ' HTML pages checked.');
if (failures.length) { console.error(failures.join('\n\n')); process.exitCode = 1; }
else console.log('HN preflight passed: no JavaScript syntax errors or missing static file references.');
