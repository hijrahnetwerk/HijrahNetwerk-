import Link from "next/link";

const phases = [["01","Oriënteren"],["02","Voorbereiden"],["03","Integreren"],["04","Terugkeren"]];

export default function HomePage() {
  return (
    <main>
      <section className="hero"><div className="wrap">
        <p className="eyebrow">HIJRAH NETWERK</p>
        <h1>Van oriëntatie tot integratie.</h1>
        <p className="lead">Een netwerk voor zusters die willen emigreren of al geëmigreerd zijn. Dit is de nieuwe Next.js-basis van HN.</p>
        <div className="phases" aria-label="HN-fases">
          {phases.map(([number,label]) => <div className="phase" key={number}><span>{number}</span><strong>{label}</strong></div>)}
        </div>
      </div></section>
      <section className="wrap content">
        <h2>Nieuwe platformbasis</h2>
        <p>De migratie gebeurt op een aparte branch. De bestaande site blijft onaangeraakt totdat alle onderdelen zijn overgezet, gecontroleerd en getest.</p>
        <nav aria-label="Migratie"><Link href="/migratie">Migratie-status</Link></nav>
      </section>
    </main>
  );
}
