"use client";

import UiIcon from "./ui-icon";
import type { Contribution, SoulEdge, SoulTerm } from "@/lib/soul-types";

export function ContributionExample({ contribution }: { contribution: Contribution }) {
  const link = contribution.source && /^https?:\/\//i.test(contribution.source) ? contribution.source : null;
  return <article className="soul-evidence">
    <span className="soul-kicker">{contribution.type === "survey" ? "Spørgeskemasvar" : "Citat"} · {contribution.category}</span>
    <p>{contribution.text}</p>
    {contribution.source && <small>{link ? <a href={link} target="_blank" rel="noopener noreferrer">Kildehenvisning <UiIcon name="arrow" /></a> : contribution.source}</small>}
    <a href={contribution.contextHref}>{contribution.type === "survey" ? "Åbn besvarelsen" : "Åbn citatet i sin sammenhæng"} <UiIcon name="arrow" /></a>
  </article>;
}

export default function SoulDetail({ term, edge, contributions, onClose }: { term?: SoulTerm; edge?: SoulEdge; contributions: Contribution[]; onClose: () => void }) {
  const ids = term?.contributionIds || edge?.contributionIds || [];
  const examples = contributions.filter((c) => ids.includes(c.id));
  const editorialExample = edge?.exampleId ? contributions.find((c) => c.id === edge.exampleId) : undefined;
  const categories = [...new Set(examples.map((c) => c.category))].map((category) => ({ category, count: examples.filter((c) => c.category === category).length }));
  return <aside className="soul-detail" aria-label="Detaljer og dokumentation" tabIndex={-1}>
    <button className="soul-close" onClick={onClose} aria-label="Luk detaljer"><UiIcon name="close" /></button>
    <div className="soul-kicker">{term ? term.kind === "phrase" ? "VENDING" : term.kind === "group" ? "MANUEL VARIANTGRUPPE" : "ORD" : edge?.kind === "editorial" ? "REDAKTIONEL FORBINDELSE" : "DOKUMENTERET FORBINDELSE"}</div>
    <h2>{term?.label || <>{edge?.source}<span className="soul-detail-connector">↔</span>{edge?.target}</>}</h2>
    {edge?.kind === "editorial" ? <>
      <p className="soul-editorial-note">{edge.note}</p>
      <p className="soul-small">En foreløbig, redaktionel vurdering. Denne linje indgår ikke i den dokumenterede forbindelsesstyrke.</p>
      {editorialExample ? <><h3>Tilknyttet kildeeksempel</h3><ContributionExample contribution={editorialExample} /></> : <p className="soul-small">Intet tilgængeligt kildeeksempel er tilknyttet.</p>}
    </> : <>
      <p className="soul-detail-count"><strong>{ids.length}</strong> af {contributions.length} bidrag <span>· {contributions.length ? Math.round(ids.length / contributions.length * 100) : 0} %</span></p>
      <p className="soul-small">{term ? "Hvert citat eller enkelt svar tæller højst én gang, også når ordet gentages." : "Begge ord findes i hvert af disse bidrag. Forskellige svarfelter forbindes ikke automatisk, selv om de er fra samme besvarelse."}</p>
      {term?.kind === "group" && <p className="soul-small">Manuelt samlet fra: {term.variants.join(", ")}. Bidrag med flere varianter tæller stadig kun én gang.</p>}
      <h3>Materiale</h3>{(["quote", "survey"] as const).map(type => <div key={type} className="soul-breakdown"><span>{type === "quote" ? "Citater" : "Spørgeskemasvar"}</span><strong>{examples.filter(c => c.type === type).length}</strong></div>)}
      <h3>Materialets kategorier</h3>
      {categories.map(({ category, count }) => <div key={category} className="soul-breakdown"><span>{category}</span><strong>{count}</strong></div>)}
      <h3>Bidragene bag</h3>
      {examples.map((contribution) => <ContributionExample key={contribution.id} contribution={contribution} />)}
    </>}
  </aside>;
}
