import Image from "next/image";
import Link from "next/link";
import { articles, sources } from "@/lib/research-data";

const modules = [
  { number: "01", title: "Wiki", description: "Kildebaseret viden om historie, mennesker og organisation.", href: "/wiki", label: "Åbn wiki", icon: "↗" },
  { number: "02", title: "Kilder", description: "Rapporter, arkivfund og officielle dokumenter samlet ét sted.", href: "/kilder", label: "Se kilder", icon: "⌕" },
  { number: "03", title: "Citater", description: "Udsagn, stemmer og perspektiver fra karneval.", href: "/citater", label: "Se citater", icon: "“" },
];

export default function Home() {
  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="breadcrumbs"><span>RESEARCHRUM</span><i>/</i> Overblik</div>
        <div className="topbar-status"><span className="status-dot" /> Intern arbejdsflade</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">AALBORG KARNEVAL · RESEARCHRUM</div>
          <h1>Sjælen<br />af <em>Karneval</em></h1>
          <p className="hero-lede">Et fælles sted at samle viden, kilder og perspektiver om Aalborg Karneval.</p>
          <Link className="text-link" href="/wiki">Gå til wiki <span>↗</span></Link>
        </div>
        <div className="hero-image" aria-hidden="true">
          <Image src="/billeder/55294814841_c655854eda_k.jpg" alt="" fill priority sizes="(max-width: 720px) 100vw, 43vw" style={{ objectPosition: "42% center" }} />
          <div className="hero-image-secondary">
            <Image src="/billeder/55273845778_8ebea9cb99_k.jpg" alt="" fill sizes="100px" />
          </div>
        </div>
      </section>

      <section className="stats-row" aria-label="Researchrummets indhold">
        <div className="stat"><span className="stat-number">{articles.length}</span><span>Wikiartikler</span></div>
        <div className="stat"><span className="stat-number">{sources.length}</span><span>Registrerede kilder</span></div>
        <div className="stat"><span className="stat-number">1983</span><span>Første karneval</span></div>
      </section>

      <section className="section-heading">
        <div><div className="eyebrow muted">INDHOLD</div><h2>Et sted at begynde</h2></div>
        <span className="section-index">01 — 03</span>
      </section>
      <section className="area-grid">
        {modules.map((module) => (
          <Link className="area-card" href={module.href} key={module.number}>
            <span className="area-icon" aria-hidden="true">{module.icon}</span>
            <span className="area-number">{module.number}</span>
            <h3>{module.title}</h3>
            <p>{module.description}</p>
            <span className="card-link">{module.label} <b>↗</b></span>
          </Link>
        ))}
      </section>

      <section className="image-strip" aria-hidden="true">
        <Image src="/billeder/55272795752_cde3fef626_k.jpg" alt="" fill sizes="(max-width: 720px) 100vw, 900px" />
      </section>

      <section className="section-heading">
        <div><div className="eyebrow muted">NYLIGT TILFØJET</div><h2>Første wikiartikler</h2></div>
        <Link className="section-index" href="/wiki">ALLE ARTIKLER ↗</Link>
      </section>
      <section className="article-list">
        {articles.slice(0, 3).map((article) => (
          <Link href={"/wiki/" + article.slug} className="article-row" key={article.slug}>
            <span className="article-category">{article.category}</span>
            <div><h2>{article.title}</h2><p>{article.summary}</p><div className="article-meta">{article.reading} · {article.sources.length} kilder</div></div>
            <span className="article-arrow">↗</span>
          </Link>
        ))}
      </section>
      <footer className="page-footer">
        <span>SJÆLEN AF KARNEVAL <i>·</i> VIDEN, KILDER, PERSPEKTIVER</span>
        <span>FØRSTE UDGAVE · 2026</span>
      </footer>
    </div>
  );
}
