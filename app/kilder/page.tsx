import Link from "next/link";
import { sources } from "@/lib/research-data";

export default function SourcesPage() {
  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="breadcrumbs"><Link href="/">RESEARCHRUM</Link><i>/</i> Kilder</div>
        <div className="topbar-status"><span className="status-dot" /> {sources.length} kilder</div>
      </header>
      <section className="subpage-hero">
        <div className="eyebrow">DOKUMENTATION & SPOR</div>
        <h1>Kilder<span className="title-period">.</span></h1>
        <p>Et register over det materiale, som wikiartiklerne bygger på. Kilderne beskrives med ophav, type, placering og metode, hvor det er relevant.</p>
      </section>
      <div className="source-toolbar"><span>ALLE REGISTREREDE KILDER</span><span className="result-count">{sources.length} KILDER</span></div>
      <section className="source-list">
        {sources.map((source, index) => (
          <article className="source-card" id={source.id} key={source.id}>
            <span className="source-symbol" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <div className="source-kind">{source.kind}</div>
              <h2>{source.title}</h2>
              <p className="source-creator">{source.creator} · {source.date}</p>
              <p>{source.description}</p>
              {source.method && <p className="source-method"><strong>Metode / forbehold:</strong> {source.method}</p>}
            </div>
            <div className="source-location">{source.location}{source.url && <a href={source.url} target="_blank" rel="noreferrer">Åbn kilde ↗</a>}</div>
          </article>
        ))}
      </section>
      <footer className="page-footer"><span>SJÆLEN AF KARNEVAL <i>·</i> KILDEREGISTER</span><span>OPDATERET I TAKT MED RESEARCHEN</span></footer>
    </div>
  );
}
