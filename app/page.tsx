import Link from "next/link";

const areas = [
  {
    number: "01",
    title: "Wiki",
    description: "Saml den fælles viden om historien, menneskene og traditionerne.",
    href: "/wiki",
    label: "Åbn wiki",
    icon: "✳",
    tone: "coral",
  },
  {
    number: "02",
    title: "Kilderegister",
    description: "Find artikler, arkivmateriale, rapporter og andre kilder ét sted.",
    href: "/kilder",
    label: "Se kilder",
    icon: "↗",
    tone: "blue",
  },
];

export default function Home() {
  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="breadcrumbs"><span>RESEARCHRUM</span><i>/</i> Overblik</div>
        <div className="topbar-status"><span className="status-dot" /> Arbejdsrum under opbygning</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> ET FÆLLES UNDERSØGELSESRUM</div>
          <h1>Hvad er <em>sjælen</em><br />af Karneval?</h1>
          <p className="hero-lede">
            Et sted til at samle det, vi ved, det vi hører, og de spørgsmål,
            der kan bringe os tættere på Aalborg Karnevals væsen.
          </p>
          <Link className="text-link" href="/wiki">Gå på opdagelse <span>↗</span></Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="sun-disc" />
          <span className="art-star star-a">✳</span>
          <span className="art-star star-b">✦</span>
          <span className="art-dot dot-a" />
          <span className="art-dot dot-b" />
          <span className="art-caption">BYEN<br />SOM SCENE</span>
        </div>
        <div className="hero-index">AK / 01</div>
      </section>

      <section className="stats-row" aria-label="Indhold i researchrummet">
        <div className="stat"><span className="stat-number">—</span><span>Wikiartikler</span></div>
        <div className="stat"><span className="stat-number">—</span><span>Registrerede kilder</span></div>
        <div className="stat"><span className="stat-number">—</span><span>Åbne spørgsmål</span></div>
        <p>Indhold tilføjes, efterhånden som researchen bliver samlet og gennemgået.</p>
      </section>

      <section className="section-heading">
        <div>
          <div className="eyebrow muted">FØRSTE MODULER</div>
          <h2>Et sted at begynde</h2>
        </div>
        <span className="section-index">01 — 02</span>
      </section>

      <section className="area-grid">
        {areas.map((area) => (
          <Link className="area-card" href={area.href} key={area.number}>
            <div className={"area-icon " + area.tone}>{area.icon}</div>
            <span className="area-number">{area.number}</span>
            <h3>{area.title}</h3>
            <p>{area.description}</p>
            <span className="card-link">{area.label} <b>↗</b></span>
          </Link>
        ))}
      </section>

      <footer className="page-footer">
        <span>SJÆLEN AF KARNEVAL <i>·</i> ET FÆLLES RESEARCHRUM</span>
        <span>BYGGET TIL AT BLIVE KLOGERE</span>
      </footer>
    </div>
  );
}