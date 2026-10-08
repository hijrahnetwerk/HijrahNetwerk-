import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !anonKey) {
  throw new Error("[HN] NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY zijn vereist.");
}

// Reuse the existing HN build transformation during the compatibility phase.
// This keeps the current pages, injected runtime scripts, asset paths and sitemap
// behavior intact while the UI is migrated page-by-page into Next.js.
execFileSync(process.execPath, ["build.js"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: anonKey,
    HN_SITE_URL: process.env.HN_SITE_URL || "https://hijrah-netwerk.vercel.app"
  }
});
const publicDir = path.join(root, "public");
const legacyDir = path.join(publicDir, "legacy");
const sourceAssets = path.join(root, "assets");
const publicAssets = path.join(publicDir, "assets");

fs.mkdirSync(legacyDir, { recursive: true });
fs.mkdirSync(publicAssets, { recursive: true });

function copyDir(source, destination) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function copyIfExists(file, destination) {
  const source = path.join(root, file);
  if (fs.existsSync(source)) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
}

copyDir(sourceAssets, publicAssets);

for (const file of fs.readdirSync(root)) {
  if (file.endsWith(".html")) copyIfExists(file, path.join(legacyDir, file));
}

for (const file of ["auth.js", "supabase-client.js", "site-app.js", "nav-auth.js", "copy-protection.js", "auth-style.css"]) {
  copyIfExists(file, path.join(publicDir, file));
}

for (const file of ["robots.txt", "favicon.ico"]) {
  copyIfExists(file, path.join(publicDir, file));
}

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !anonKey) {
  throw new Error("[HN] NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY zijn vereist voor de legacy compatibility build.");
}

fs.writeFileSync(
  path.join(publicAssets, "config.js"),
  `window.__ENV = { SUPABASE_URL: ${JSON.stringify(supabaseUrl)}, SUPABASE_ANON_KEY: ${JSON.stringify(anonKey)} };\n`,
  "utf8"
);

console.log("[HN] Legacy compatibility assets voorbereid.");
