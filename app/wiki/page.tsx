import Link from "next/link";
import { articles } from "@/lib/research-data";
import WikiPaused from "@/components/wiki-paused";

const WIKI_ENABLED = false;

export default function WikiPage() {
  if (!WIKI_ENABLED) return <WikiPaused />;
  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="breadcrumbs"><Link href="/">RESEARCHRUM</Link><i>/</i> Wiki</div>
        <div className="topbar-status"><span className="status-dot" /> {articles.length} artikler</div>
      </header>
      <section className="subpage-hero">
        <div className="eyebrow">VIDEN & FORTÆLLINGER</div>
        <h1>Wiki<span className="title-period">.</span></h1>
        <p>En kildebaseret oversigt over Aalborg Karnevals historie, organisation og gæsternes oplevelser. Hver artikel viser, hvor oplysningerne kommer fra.</p>
      </section>
      <div className="content-toolbar">
        <span>ARTIKLER</span><span className="result-count">{articles.length} SIDER</span>
      </div>
      <section className="article-list">
        {articles.map((article) => (
          <Link href={"/wiki/" + article.slug} className="article-row" key={article.slug}>
            <span className="article-category">{article.category}</span>
            <div><h2>{article.title}</h2><p>{article.summary}</p><div className="article-meta">{article.reading} · {article.sources.length} kilder · {article.updated}</div></div>
            <span className="article-arrow">↗</span>
          </Link>
        ))}
      </section>
      <div className="editorial-note" style={{ marginTop: 25 }}>Dokumenterede oplysninger, kildeudsagn og foreløbige fortolkninger er markeret hver for sig. Artiklerne udvides, når nye kilder og stemmer kommer til.</div>
      <footer className="page-footer"><span>SJÆLEN AF KARNEVAL <i>·</i> WIKI</span><span>FØRSTE UDGAVE · 2026</span></footer>
    </div>
  );
}
