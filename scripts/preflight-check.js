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
const adminBlogs = source('admin-blogs.html');
const adminDashboard = source('admin.html');
const editor = source('assets/hn-publication-editor.js');
const article = source('blog-artikel.html');
const articlePreview = source('assets/hn-article-draft-preview.js');
const vercel = JSON.parse(source('vercel.json'));
if (!protection.includes('client.rpc("is_admin")') || !protection.includes('result.data === true') || !protection.includes('allowAdmin()')) {
  failures.push('Copy protection must fail closed and only allow a confirmed admin role.');
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
