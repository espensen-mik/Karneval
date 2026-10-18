"use client";

import UiIcon from "./ui-icon";
import { FormEvent, useMemo, useState } from "react";
import { normalizeTerm } from "@/lib/soul-analysis";
import { SOUL_COLORS } from "@/lib/soul-types";
import type { Contribution, Curation, EditorialLink, SoulCategory, SoulTerm, SynonymGroup } from "@/lib/soul-types";
import { ContributionExample } from "./soul-detail";

export type SaveCuration = (resource: keyof Curation, method: "POST" | "PATCH" | "DELETE", values: Record<string, unknown>) => Promise<void>;

function TermPicker({ terms, selected, onChange, contributions, disabled }: { terms: SoulTerm[]; selected: string[]; onChange: (terms: string[]) => void; contributions: Contribution[]; disabled: boolean }) {
  const [query, setQuery] = useState("");
  const [inspect, setInspect] = useState<string | null>(null);
  const normalized = normalizeTerm(query);
  const found = terms.filter((term) => !normalized || term.label.includes(normalized));
  const inspected = terms.find((term) => term.id === inspect);
  const missing = selected.filter((value) => !terms.some((term) => term.id === value));
  return <div className="soul-term-picker">
    <label className="form-field">Find ord og vendinger<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Søg i bidragets tekst …" /></label>
    <p className="soul-small">Sorteret efter antal bidrag. Listen viser højst 80 matches ad gangen.</p>
    <div className="soul-term-options">
      {found.slice(0, 80).map((term) => <div key={term.id} className="soul-term-option">
        <label><input type="checkbox" disabled={disabled} checked={selected.includes(term.id)} onChange={(event) => onChange(event.target.checked ? [...selected, term.id] : selected.filter((id) => id !== term.id))} /><span>{term.label}</span><small>{term.count} bidrag</small></label>
        <button type="button" onClick={() => setInspect(term.id)} aria-label={`Se bidrag for ${term.label}`}>Se</button>
      </div>)}
      {!found.length && <p className="soul-small">Ingen ord matcher søgningen i det aktuelle materiale.</p>}
      {missing.map((value) => <label className="soul-small" key={value}><input type="checkbox" disabled={disabled} checked onChange={() => onChange(selected.filter((id) => id !== value))} /> {value} · ikke i det aktuelle materiale</label>)}
    </div>
    {inspected && <div className="soul-term-preview"><h4>{inspected.label} · {inspected.count} bidrag</h4>{contributions.filter((c) => inspected.contributionIds.includes(c.id)).slice(0, 3).map((c) => <ContributionExample contribution={c} key={c.id} />)}</div>}
  </div>;
}

function CategoryEditor({ category, terms, contributions, save, busy }: { category?: SoulCategory; terms: SoulTerm[]; contributions: Contribution[]; save: SaveCuration; busy: boolean }) {
  const [members, setMembers] = useState(category?.terms || []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save("categories", category ? "PATCH" : "POST", { id: category?.id, updated_at: category?.updated_at, name: form.get("name"), description: form.get("description"), color: form.get("color"), terms: members, archived: category?.archived || false });
  }
  return <form onSubmit={(e) => void submit(e).catch(() => {})} className="soul-curation-form">
    <h3>{category ? "Redigér kategori" : "Opret en fortolkningskategori"}</h3>
    <label className="form-field">Navn<input name="name" defaultValue={category?.name} required maxLength={100} disabled={busy} /></label>
    <label className="form-field">Kort forklaring<textarea name="description" defaultValue={category?.description} maxLength={600} rows={2} disabled={busy} /></label>
    <fieldset className="soul-color-picker" disabled={busy}><legend>Markering</legend>{SOUL_COLORS.map((color, index) => <label key={color} style={{ background: color }}><input type="radio" name="color" value={color} defaultChecked={(category?.color || SOUL_COLORS[0]) === color} aria-label={`Farve ${index + 1}`} /></label>)}</fieldset>
    <TermPicker terms={terms} selected={members} onChange={setMembers} contributions={contributions} disabled={busy} />
    <div className="soul-form-actions"><button className="soul-primary" disabled={busy} type="submit">{category ? "Gem kategori" : "Opret kategori"}</button>
      {category && <button type="button" className="soul-text-button" disabled={busy} onClick={() => void save("categories", "PATCH", { ...category, archived: !category.archived }).catch(() => {})}>{category.archived ? "Genåbn kategori" : "Arkivér kategori"}</button>}
    </div>
  </form>;
}

function SynonymEditor({ group, terms, contributions, save, busy }: { group?: SynonymGroup; terms: SoulTerm[]; contributions: Contribution[]; save: SaveCuration; busy: boolean }) {
  const [members, setMembers] = useState(group?.terms || []);
  const [label, setLabel] = useState(group?.label || "");
  return <form className="soul-curation-form" onSubmit={(event) => { event.preventDefault(); void save("synonyms", group ? "PATCH" : "POST", { id: group?.id, updated_at: group?.updated_at, label, terms: members }).catch(() => {}); }}>
    <h3>{group ? "Redigér variantgruppe" : "Saml varianter manuelt"}</h3>
    <p className="soul-small">Vælg mindst to eksisterende ord eller vendinger og ét af dem som visningsord. De oprindelige tekster ændres ikke. En variant kan kun tilhøre én gruppe.</p>
    <TermPicker terms={terms} selected={members} onChange={(next) => { setMembers(next); if (!next.includes(label)) setLabel(next[0] || ""); }} contributions={contributions} disabled={busy} />
    <label className="form-field">Visningsord<select value={label} required onChange={(event) => setLabel(event.target.value)} disabled={busy}><option value="">Vælg et af gruppens ord</option>{members.map((word) => <option key={word}>{word}</option>)}</select></label>
    <div className="soul-form-actions"><button className="soul-primary" type="submit" disabled={busy || members.length < 2}>Gem variantgruppe</button>{group && <button className="soul-text-button" type="button" disabled={busy} onClick={() => void save("synonyms", "DELETE", { id: group.id, updated_at: group.updated_at }).catch(() => {})}>Opløs gruppe</button>}</div>
  </form>;
}

function LinkEditor({ link, terms, contributions, save, busy }: { link?: EditorialLink; terms: SoulTerm[]; contributions: Contribution[]; save: SaveCuration; busy: boolean }) {
  const [source, setSource] = useState(link?.source_term || "");
  const [target, setTarget] = useState(link?.target_term || "");
  const options = [...new Set([...terms.map((t) => t.id), ...(link ? [link.source_term, link.target_term] : [])])].sort((a, b) => a.localeCompare(b, "da"));
  return <form className="soul-curation-form" onSubmit={(event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void save("links", link ? "PATCH" : "POST", { id: link?.id, updated_at: link?.updated_at, source_term: source, target_term: target, note: form.get("note"), example_quote_id: form.get("example") || null }).catch(() => {});
  }}>
    <h3>{link ? "Redigér fortolket forbindelse" : "Tilføj en fortolket forbindelse"}</h3>
    <p className="soul-small">En redaktionel vurdering vises stiplet og tæller aldrig som dokumenteret samforekomst.</p>
    <label className="form-field">Fra ord<select required value={source} onChange={(event) => setSource(event.target.value)} disabled={busy}><option value="">Vælg ord</option>{options.map((word) => <option key={word}>{word}</option>)}</select></label>
    <label className="form-field">Til ord<select required value={target} onChange={(event) => setTarget(event.target.value)} disabled={busy}><option value="">Vælg ord</option>{options.filter((word) => word !== source).map((word) => <option key={word}>{word}</option>)}</select></label>
    <label className="form-field">Redaktionel note<textarea required name="note" maxLength={1200} defaultValue={link?.note} rows={3} disabled={busy} /></label>
    <label className="form-field">Kildeeksempel <span>Valgfrit · ikke en ekstra optælling</span><select name="example" defaultValue={link?.example_quote_id || ""} disabled={busy}><option value="">Intet kildeeksempel</option>{contributions.filter((c) => c.type === "quote").map((c) => <option value={c.id} key={c.id}>{c.text.slice(0, 100)}{c.text.length > 100 ? "…" : ""}</option>)}</select></label>
    <div className="soul-form-actions"><button type="submit" className="soul-primary" disabled={busy}>Gem forbindelse</button>{link && <button className="soul-text-button" type="button" disabled={busy} onClick={() => void save("links", "DELETE", { id: link.id, updated_at: link.updated_at }).catch(() => {})}>Fjern forbindelse</button>}</div>
  </form>;
}

export default function SoulCuration({ curation, terms, contributions, save, busy, error, onReload }: { curation: Curation; terms: SoulTerm[]; contributions: Contribution[]; save: SaveCuration; busy: boolean; error: string; onReload: () => void }) {
  const [tab, setTab] = useState<keyof Curation>("categories");
  const [editing, setEditing] = useState<string | null>(null);
  const [uncategorized, setUncategorized] = useState(false);
  const assigned = useMemo(() => new Set(curation.categories.filter((c) => !c.archived).flatMap((c) => c.terms)), [curation.categories]);
  const category = curation.categories.find((c) => c.id === editing);
  const shownTerms = uncategorized && tab === "categories" ? terms.filter((t) => !assigned.has(t.id) || category?.terms.includes(t.id)) : terms;
  const synonym = curation.synonyms.find((s) => s.id === editing);
  const link = curation.links.find((l) => l.id === editing);
  const formKey = `${tab}:${editing || "new"}:${category?.updated_at || synonym?.updated_at || link?.updated_at || curation[tab].length}`;
  return <section className="soul-curation" aria-labelledby="soul-curation-title">
    <div className="soul-curation-heading"><div><span className="soul-kicker">VORES FORELØBIGE LÆSNING</span><h2 id="soul-curation-title">Kuratering</h2><p>Organisér fortolkningerne. Materialet og de dokumenterede optællinger bevares.</p></div><button className="soul-text-button" disabled={busy} onClick={onReload}>Genindlæs kuratering <UiIcon name="refresh" /></button></div>
    <div className="soul-curation-tabs" role="group" aria-label="Kurateringstype">{([ ["categories", "Kategorier"], ["links", "Fortolkede forbindelser"], ["synonyms", "Varianter & synonymer"] ] as const).map(([key, label]) => <button key={key} aria-pressed={tab === key} onClick={() => { setTab(key); setEditing(null); }}>{label}</button>)}</div>
    {error && <p className="soul-message error" role="alert">{error}</p>}
    <div className="soul-curation-layout">
      <div className="soul-curation-index">
        <button className="soul-new" disabled={busy} onClick={() => setEditing(null)}>+ {tab === "categories" ? "Ny kategori" : tab === "synonyms" ? "Ny variantgruppe" : "Ny forbindelse"}</button>
        {tab === "categories" && <>
          <label className="soul-small soul-check"><input type="checkbox" checked={uncategorized} onChange={(event) => setUncategorized(event.target.checked)} />Vis kun ukategoriserede ord ({terms.filter((t) => !assigned.has(t.id)).length})</label>
          {curation.categories.map((c) => <button className={editing === c.id ? "selected" : ""} key={c.id} onClick={() => setEditing(c.id)} disabled={busy}><i style={{ background: c.color }} />{c.name}<small>{c.archived ? "Arkiveret" : `${c.terms.length} tilknytninger`}</small></button>)}
        </>}
        {tab === "synonyms" && curation.synonyms.map((g) => <button className={editing === g.id ? "selected" : ""} key={g.id} onClick={() => setEditing(g.id)} disabled={busy}>{g.label}<small>{g.terms.join(" · ")}</small></button>)}
        {tab === "links" && curation.links.map((l) => <button className={editing === l.id ? "selected" : ""} key={l.id} onClick={() => setEditing(l.id)} disabled={busy}>{l.source_term} ↔ {l.target_term}<small>Redaktionel</small></button>)}
        {!curation[tab].length && <p className="soul-small">Ingen {tab === "categories" ? "kategorier" : tab === "synonyms" ? "variantgrupper" : "fortolkede forbindelser"} endnu. I bestemmer selv, hvor undersøgelsen begynder.</p>}
      </div>
      {tab === "categories" ? <CategoryEditor key={formKey} category={category} terms={shownTerms} contributions={contributions} save={save} busy={busy} /> : tab === "synonyms" ? <SynonymEditor key={formKey} group={synonym} terms={terms} contributions={contributions} save={save} busy={busy} /> : <LinkEditor key={formKey} link={link} terms={terms} contributions={contributions} save={save} busy={busy} />}
    </div>
  </section>;
}
