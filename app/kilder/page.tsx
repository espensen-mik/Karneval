import Link from "next/link";

const kinds = ["Alle typer", "Webkilder", "Arkivmateriale", "Rapporter", "Interviews"];

export default function SourcesPage() {
  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="breadcrumbs"><Link href="/">RESEARCHRUM</Link><i>/</i> Kilderegister</div>
        <div className="topbar-status"><span className="status-dot" /> Kilder kan registreres her</div>
      </header>
      <section className="subpage-hero">
        <div className="eyebrow"><span /> DOKUMENTATION & SPOR</div>
        <h1>Kilderegister<span className="title-period">.</span></h1>
        <p>Et samlet register over kilder fra nettet, arkiver og samtaler — med tydelig vej tilbage til belægget.</p>
      </section>
      <div className="source-toolbar">
        <div className="search-placeholder"><span>⌕</span> Søg på titel, person eller årstal <kbd>⌘ K</kbd></div>
        <button className="quiet-button" type="button" disabled>+ Registrér kilde</button>
      </div>
      <div className="filter-row">
        {kinds.map((kind, index) => <span className={index === 0 ? "filter-chip selected" : "filter-chip"} key={kind}>{kind}</span>)}
        <span className="filter-spacer" />
        <span className="result-count">0 KILDER</span>
      </div>
      <section className="source-empty">
        <div className="empty-symbol">↗</div>
        <div className="eyebrow muted">REGISTERET ER KLAR</div>
        <h2>Første kilde mangler kun en registrering</h2>
        <p>Her samler vi kildeoplysninger, arkivsignaturer, links, sidetal og noter om relevans.</p>
        <div className="source-fields">
          <span>Titel</span><span>Ophav</span><span>År</span><span>Type</span><span>Placering</span>
        </div>
      </section>
      <footer className="page-footer">
        <span>SJÆLEN AF KARNEVAL <i>·</i> KILDEREGISTER</span>
        <span>LINKS, ARKIVER, RAPPORTER & SAMTALER</span>
      </footer>
    </div>
  );
}