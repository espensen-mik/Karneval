import Image from "next/image";
import Link from "next/link";
import { sources } from "@/lib/research-data";
import HomeQuotes from "@/components/home-quotes";

const modules = [
  { number: "01", title: "Citater", description: "Stemmer, oplevelser og perspektiver fra karneval.", href: "/citater", label: "Se citater", icon: "“" },
  { number: "02", title: "Kilder", description: "Rapporter, arkivfund og officielle dokumenter samlet ét sted.", href: "/kilder", label: "Se kilder", icon: "⌕" },
  { number: "03", title: "Wiki · pause", description: "Wikividen er midlertidigt sat på pause. Indholdet er bevaret.", href: null, label: "Midlertidigt pauseret", icon: "▤" },
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
          <Link className="text-link" href="/citater">Gå til citatsamlingen <span>↗</span></Link>
        </div>
        <div className="hero-image" aria-hidden="true">
          <Image src="/billeder/55294814841_c655854eda_k.jpg" alt="" fill priority sizes="(max-width: 720px) 100vw, 43vw" style={{ objectPosition: "42% center" }} />
          <div className="hero-image-secondary">
            <Image src="/billeder/55273845778_8ebea9cb99_k.jpg" alt="" fill sizes="100px" />
          </div>
        </div>
      </section>

      <section className="stats-row" aria-label="Researchrummets indhold">
        <div className="stat"><span className="stat-number">{sources.length}</span><span>Registrerede kilder</span></div>
        <div className="stat"><span className="stat-number">1983</span><span>Første karneval</span></div>
        <div className="stat"><span className="stat-number">5</span><span>Kategorier i citatsamlingen</span></div>
      </section>

      <section className="section-heading home-quote-heading">
        <div><div className="eyebrow muted">STEMMER & PERSPEKTIVER</div><h2>Karneval fortalt indefra</h2></div>
        <span className="section-index">CITATSAMLING</span>
      </section>
      <HomeQuotes />

      <section className="section-heading">
        <div><div className="eyebrow muted">RESEARCHRUM</div><h2>Et sted at begynde</h2></div>
        <span className="section-index">01 — 03</span>
      </section>
      <section className="area-grid">
        {modules.map((module) => module.href ? (
          <Link className="area-card" href={module.href} key={module.number}>
            <span className="area-icon" aria-hidden="true">{module.icon}</span><span className="area-number">{module.number}</span>
            <h3>{module.title}</h3><p>{module.description}</p><span className="card-link">{module.label} <b>↗</b></span>
          </Link>
        ) : (
          <div className="area-card area-card-paused" key={module.number} aria-disabled="true">
            <span className="area-icon" aria-hidden="true">{module.icon}</span><span className="area-number">{module.number}</span>
            <h3>{module.title}</h3><p>{module.description}</p><span className="card-link">{module.label}</span>
          </div>
        ))}
      </section>
      <section className="image-strip" aria-hidden="true">
        <Image src="/billeder/55272795752_cde3fef626_k.jpg" alt="" fill sizes="(max-width: 720px) 100vw, 900px" />
      </section>

      <footer className="page-footer">
        <span>SJÆLEN AF KARNEVAL <i>·</i> VIDEN, KILDER, PERSPEKTIVER</span>
        <span>FØRSTE UDGAVE · 2026</span>
      </footer>
    </div>
  );
}
