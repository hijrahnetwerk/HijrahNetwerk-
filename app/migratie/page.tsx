export const metadata = { title: "Migratie-status", robots: { index: false, follow: false } };

export default function MigrationPage() {
  return (
    <main className="wrap content">
      <p className="eyebrow">HN TECHNISCHE MIGRATIE</p>
      <h1>Next.js + React + TypeScript</h1>
      <p>Deze branch is de nieuwe applicatiebasis. De productieomgeving wordt pas vervangen nadat de volledige migratie, beveiligingscontrole, functionele tests en Cloudflare-validatie zijn afgerond.</p>
      <ul>
        <li>Frontend: Next.js App Router + React + TypeScript</li>
        <li>Backend: bestaande Supabase PostgreSQL, Auth, Storage en RLS</li>
        <li>Hostingdoel: Cloudflare Workers</li>
        <li>Bronbeheer: GitHub</li>
        <li>Secrets: uitsluitend server/build environment, nooit in clientcode</li>
      </ul>
    </main>
  );
}
