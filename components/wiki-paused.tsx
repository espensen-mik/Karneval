import Link from "next/link";

export default function WikiPaused() {
  return (
    <div className="page-wrap">
      <header className="topbar"><div className="breadcrumbs"><Link href="/">RESEARCHRUM</Link><i>/</i> Wiki</div><div className="topbar-status">Midlertidigt pauseret</div></header>
      <section className="wiki-paused-panel">
        <div className="eyebrow">WIKI · MIDLERTIDIGT PAUSERET</div>
        <h1>Vi vender tilbage til wikien<span className="title-period">.</span></h1>
        <p>Wikiens sider er sat på pause, mens vi samler researchrummet omkring citater, kilder og perspektiver. Det eksisterende wikiindhold og kildedata er bevaret.</p>
        <Link className="text-link" href="/citater">Gå til citatsamlingen <span>↗</span></Link>
      </section>
      <footer className="page-footer"><span>SJÆLEN AF KARNEVAL <i>·</i> WIKI PAUSERET</span><Link href="/">TIL OVERBLIK ↗</Link></footer>
    </div>
  );
}
