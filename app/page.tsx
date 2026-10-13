import Image from "next/image";
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

const moments = [
  {
    src: "/billeder/55273845778_8ebea9cb99_k.jpg",
    alt: "Farverig performer folder et stort blåt kostume ud blandt publikum med paraplyer.",
    caption: "Kostumer, bevægelse og mødet med publikum",
    tag: "I GADEN",
  },
  {
    src: "/billeder/55273948584_9aa30abbdd_k.jpg",
    alt: "Børn vinker fra en dekoreret vogn under karnevalsoptoget.",
    caption: "Karnevallet set fra optoget",
    tag: "SAMMEN",
  },
  {
    src: "/billeder/55272795752_cde3fef626_k.jpg",
    alt: "Udklædte børn og voksne samles til en aktivitet indendørs.",
    caption: "En fest, der også skaber plads til børnene",
    tag: "FÆLLESSKAB",
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
        <figure className="hero-photo">
          <Image
            src="/billeder/55294814841_c655854eda_k.jpg"
            alt="Karnevalist i rød fjerdragt og stort hovedpryd."
            fill
            priority
            sizes="(max-width: 680px) 100vw, 48vw"
            style={{ objectPosition: "42% center" }}
          />
          <figcaption>
            <span>ET ØJEBLIK FRA KARNEVALLET</span>
            <strong>Farver, frihed, fællesskab</strong>
          </figcaption>
          <span className="photo-index">01 / 09</span>
        </figure>
      </section>

      <section className="stats-row" aria-label="Indhold i researchrummet">
        <div className="stat"><span className="stat-number">—</span><span>Wikiartikler</span></div>
        <div className="stat"><span className="stat-number">—</span><span>Registrerede kilder</span></div>
        <div className="stat"><span className="stat-number">—</span><span>Åbne spørgsmål</span></div>
        <p>Indhold tilføjes, efterhånden som researchen bliver samlet og gennemgået.</p>
      </section>

      <section className="visual-section">
        <div className="section-heading visual-heading">
          <div>
            <div className="eyebrow muted">GLIMT AF KARNEVALET</div>
            <h2>En by fuld af liv</h2>
          </div>
          <span className="section-index">BILLEDER / 01—03</span>
        </div>
        <div className="photo-grid">
          {moments.map((moment, index) => (
            <figure className="photo-card" key={moment.src}>
              <div className="photo-frame">
                <Image
                  src={moment.src}
                  alt={moment.alt}
                  fill
                  sizes="(max-width: 680px) 100vw, (max-width: 950px) 50vw, 33vw"
                />
                <span className="photo-tag">{moment.tag}</span>
              </div>
              <figcaption><span>0{index + 1}</span>{moment.caption}</figcaption>
            </figure>
          ))}
        </div>
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