'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');
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
  for (const scriptMatch of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attributes = scriptMatch[1] || '';
    const body = scriptMatch[2] || '';
    const typeMatch = attributes.match(/\btype\s*=\s*["']([^"']+)["']/i);
    if (/\bsrc\s*=/.test(attributes) || /\btype\s*=\s*["']module["']/i.test(attributes) || !body.trim()) continue;
    if (typeMatch && !/^(text|application)\/javascript$/i.test(typeMatch[1])) continue;
    try { new vm.Script(body, { filename: path.relative(root, file) + ':inline-script' }); }
    catch (error) { failures.push('Inline JavaScript syntax: ' + path.relative(root, file) + '\n' + error.message); }
  }
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
const adminBlogs = source('admin-blogs.html');
const adminDashboard = source('admin.html');
const adminRewards = source('admin-beloningen.html');
const passportAdmin = source('admin-paspoort.html');
const adminScripts = source('assets/admin.js');
const submissionNotesMigration = source('supabase/migrations/20261014121000_private_submission_admin_notes.sql');
const profileNotesMigration = source('supabase/migrations/20261014122000_private_profile_admin_notes.sql');
const profileVisibilityMigration = source('supabase/migrations/20261014123000_profile_visibility_opt_in.sql');
const passportPage = source('paspoort.html');
const editor = source('assets/hn-publication-editor.js');
if (!profileVisibilityMigration.includes('alter column profile_visibility set default false') ||
    !profileVisibilityMigration.includes('hn_set_my_profile_visibility') ||
    !profileVisibilityMigration.includes('hn_guard_profile_visibility_owner') ||
    !passportPage.includes("rpc('hn_set_my_profile_visibility'") ||
    !passportPage.includes('id="profileOn"') ||
    !passportPage.includes('id="profileOff"')) {
  failures.push('Public HN profiles must be opt-in and controllable by the member.');
}
if (!profileNotesMigration.includes('create table if not exists private.hn_profile_admin_notes') ||
    !profileNotesMigration.includes('update public.profiles set admin_notes = null') ||
    !profileNotesMigration.includes('create trigger hn_strip_profile_admin_notes')) {
  failures.push('Profile moderation notes must be moved out of member-readable profile rows.');
}
if (adminScripts.includes(",admin_notes:adminNotes") || adminScripts.includes(",admin_notes:reason")) {
  failures.push('Admin submission notes must not be written directly to the member-readable submissions table.');
}
if (!passportAdmin.includes("rpc('hn_admin_reviews'") ||
    !passportAdmin.includes("rpc('hn_moderate_review'") ||
    !passportAdmin.includes("rpc('hn_admin_review_reports'") ||
    !passportAdmin.includes("rpc('hn_resolve_review_report'") ||
    !passportAdmin.includes('data-view="reviews"') ||
    !passportAdmin.includes('data-view="reports"')) {
  failures.push('Passport administration must expose review moderation and report handling through guarded RPCs.');
}
if (!adminScripts.includes("rpc('hn_admin_submission_notes'") ||
    !adminScripts.includes("rpc('hn_admin_set_submission_notes'") ||
    !submissionNotesMigration.includes('create table if not exists private.hn_submission_admin_notes') ||
    !submissionNotesMigration.includes('create trigger hn_strip_submission_admin_notes')) {
  failures.push('Submission moderation notes must be private and accessible only through admin RPCs.');
}
if (!adminRewards.includes("rpc('hn_admin_save_badge'") ||
    !adminRewards.includes("rpc('hn_admin_save_status'") ||
    !adminRewards.includes("rpc('hn_admin_set_badge'") ||
    adminRewards.includes(".from('hn_badges').insert(") ||
    adminRewards.includes(".from('hn_badges').update(") ||
    adminRewards.includes(".from('hn_statuses').insert(") ||
    adminRewards.includes(".from('hn_statuses').update(")) {
  failures.push('Passport reward administration must use guarded RPCs, not direct table writes.');
}
const article = source('blog-artikel.html');
const articlePreview = source('assets/hn-article-draft-preview.js');
const vercel = JSON.parse(source('vercel.json'));
const adminPage = source('admin.html');
const profileGuard = source('supabase/migrations/20261014120000_guard_profile_privileged_fields.sql');
if ((passportPage.match(/<script[^>]+config\.js/gi) || []).length > 1) {
  failures.push('Paspoort must load the site configuration only once.');
}
if ((adminPage.match(/<script[^>]+config\.js/gi) || []).length > 1) {
  failures.push('Admin must load the site configuration only once.');
}
if (/unpkg\.com/i.test(adminPage)) {
  failures.push('Admin page must not load executable code from unpkg.com.');
}
for (const protectedField of ['new.role', 'new.application_status', 'new.admin_notes', 'new.approved_at', 'new.verification_status', 'new.hn_status', 'new.whatsapp_verified']) {
  if (!profileGuard.includes(protectedField)) failures.push('Profile security migration must guard field: ' + protectedField);
}
if (!profileGuard.includes('create trigger hn_guard_profile_privileged_fields') ||
    !profileGuard.includes('before insert or update on public.profiles')) {
  failures.push('Profile security migration must enforce the privilege guard on inserts and updates.');
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
if (!adminBlogs.includes('Publiceren geblokkeerd') || !adminBlogs.includes("!$('fConsent').checked")) {
  failures.push('Publishing a story/interview/experience must require confirmed consent.');
}
for (const type of ['paragraph', 'heading', 'quote', 'callout', 'accordion', 'checklist', 'image', 'divider', 'budget']) {
  if (!editor.includes(type + ':')) failures.push('Publication editor missing block type: ' + type);
}
if (!article.includes('renderArticleBlocks(b.content_blocks,b.content)') || !article.includes('safeHttpUrl')) {
  failures.push('Public article page must render structured blocks and validate external URLs.');
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
