import Link from "next/link";

const topics = [
  { n: "01", title: "Historien", text: "Begyndelser, vendepunkter og udvikling gennem årene.", tint: "coral" },
  { n: "02", title: "Menneskene", text: "Initiativtagere, deltagere, frivillige og nøglepersoner.", tint: "yellow" },
  { n: "03", title: "Ritualer & symboler", text: "Paraden, kostumerne, temaerne og de tilbagevendende tegn.", tint: "blue" },
  { n: "04", title: "Karnevallets rum", text: "Gaden, byen, Kildeparken og mødet mellem dem.", tint: "green" },
];

export default function WikiPage() {
  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="breadcrumbs"><Link href="/">RESEARCHRUM</Link><i>/</i> Wiki</div>
        <div className="topbar-status"><span className="status-dot" /> Struktur klar til indhold</div>
      </header>
      <section className="subpage-hero">
        <div className="eyebrow"><span /> VIDEN & FORTÆLLINGER</div>
        <h1>Wiki<span className="title-period">.</span></h1>
        <p>En fælles, kildebaseret oversigt over Aalborg Karnevals historie, mennesker og betydning.</p>
      </section>
      <div className="content-toolbar">
        <div className="search-placeholder"><span>⌕</span> Søg i wikiartikler <kbd>⌘ K</kbd></div>
        <button className="quiet-button" type="button" disabled>+ Ny artikel</button>
      </div>
      <section className="topic-grid">
        {topics.map((topic) => (
          <article className="topic-card" key={topic.n}>
            <div className={"topic-marker " + topic.tint}>{topic.n}</div>
            <div className="topic-body">
              <h2>{topic.title}</h2>
              <p>{topic.text}</p>
              <span className="topic-count">Ingen artikler endnu</span>
            </div>
            <span className="topic-arrow">↗</span>
          </article>
        ))}
      </section>
      <div className="empty-note"><span>✳</span><p>Artiklerne skal skelne tydeligt mellem dokumenterede fakta, kildeudsagn og vores egne fortolkninger.</p></div>
    </div>
  );
}