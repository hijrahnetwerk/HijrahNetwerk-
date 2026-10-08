import type { NextConfig } from "next";

const legacy = (file: string) => ({ source: file, destination: `/legacy/${file.replace(/^\//, "")}` });

const staticRoutes = [
  "community", "landen", "navigatie", "kennisbank", "smart-search", "dashboard",
  "bijdragen", "login", "register", "admin", "admin-beloningen",
  "admin-componenten", "profiel", "vergelijken", "orientatie", "voorbereiding",
  "vertrek", "integratie", "orientatietest", "handboek", "realiteitscheck",
  "verhalen", "stedengids", "fiche", "stappenplan", "hulp", "mijn-kaart",
  "admin-hulp", "admin-kaart", "admin-wachtlijst", "admin-bewerkvoorstellen",
  "werkruimte", "reset-password", "update-password", "stad", "auteursrecht",
  "concept", "home", "admin-navigation", "admin-builder", "admin-cms"
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      ...staticRoutes.map((route) => ({
        source: `/${route}.html`,
        destination: `/${route}`,
        permanent: true,
      })),
    ];
  },
  async rewrites() {
    return [
      { source: "/", destination: "/legacy/index.html" },
      ...staticRoutes.map((route) => ({
        source: `/${route}`,
        destination: `/legacy/${route}.html`,
      })),
      { source: "/pagina/:slug", destination: "/legacy/cms-page.html?slug=:slug" },
      { source: "/artikels/:slug", destination: "/legacy/kennisbank.html?slug=:slug" },
      { source: "/fiche/:slug", destination: "/legacy/fiche.html?slug=:slug" },
      { source: "/stad/:slug", destination: "/legacy/stad.html?slug=:slug" },
      { source: "/locaties/:city/:area/:category/:slug", destination: "/legacy/fiche.html?city_slug=:city&area_slug=:area&category_slug=:category&slug=:slug" },
      { source: "/locaties/:city/:category/:slug", destination: "/legacy/fiche.html?city_slug=:city&category_slug=:category&slug=:slug" },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }
        ]
      },
      ...["admin", "dashboard", "mijn-kaart", "werkruimte"].map((route) => ({
        source: `/${route}(.*)`,
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }
        ]
      }))
    ];
  }
};

export default nextConfig;
