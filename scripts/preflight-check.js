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
console.log('HN preflight: ' + jsFiles.length + ' JavaScript files, ' + htmlFiles.length + ' HTML pages checked.');
if (failures.length) { console.error(failures.join('\n\n')); process.exitCode = 1; }
else console.log('HN preflight passed: no JavaScript syntax errors or missing static file references.');
