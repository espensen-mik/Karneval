"use client";

import UiIcon from "./ui-icon";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeContributions, networkEdges, normalizeTerm } from "@/lib/soul-analysis";
import { EMPTY_CURATION } from "@/lib/soul-types";
import type { Contribution, Curation } from "@/lib/soul-types";
import SoulNetwork from "./soul-network";
import SoulDetail from "./soul-detail";
import SoulCuration, { SaveCuration } from "./soul-curation";
import { DEFAULT_SOUL_VIEW, soulViewHref } from "@/lib/soul-view";
import type { SoulView } from "@/lib/soul-view";

async function read(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Materialet kunne ikke læses.");
  return data;
}

export default function SoulApp({ manage = false, initialView = DEFAULT_SOUL_VIEW }: { manage?: boolean; initialView?: SoulView }) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [curation, setCuration] = useState<Curation>(EMPTY_CURATION);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [curationError, setCurationError] = useState("");
  const [curationAvailable, setCurationAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState(initialView.category);
  const [kind, setKind] = useState(initialView.kind);
  const [query, setQuery] = useState(initialView.query);
  const [minimum, setMinimum] = useState(initialView.minimum);
  const [edgeMinimum, setEdgeMinimum] = useState(initialView.edgeMinimum);
  const [limit, setLimit] = useState(initialView.limit);
  const [moreEdges, setMoreEdges] = useState(initialView.moreEdges);
  const [editorialVisible, setEditorialVisible] = useState(initialView.editorialVisible);
  const [highlightCategory, setHighlightCategory] = useState(initialView.highlightCategory);
  const [selected, setSelected] = useState<string | null>(null);
  const details = useRef<HTMLDivElement>(null);

  async function loadCuration() {
    setCurationError("");
    try { setCuration(await read(await fetch("/api/sjaelen/kuratering", { cache: "no-store" }))); setCurationAvailable(true); }
    catch (error) { setCurationError(error instanceof Error ? error.message : "Kurateringen kunne ikke hentes."); setCurationAvailable(false); }
  }
  async function loadMaterial() {
    setLoading(true); setDataError("");
    try { setContributions(await read(await fetch("/api/sjaelen", { cache: "no-store" }))); }
    catch (error) { setDataError(error instanceof Error ? error.message : "Materialet kunne ikke hentes."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadMaterial(); void loadCuration(); }, []);

  const filteredContributions = useMemo(() => contributions.filter((c) => !category || c.category === category), [contributions, category]);
  const analysis = useMemo(() => analyzeContributions(filteredContributions, curationAvailable ? curation.synonyms : []), [filteredContributions, curation.synonyms, curationAvailable]);
  const rawAnalysis = useMemo(() => analyzeContributions(contributions), [contributions]);
  const normalized = normalizeTerm(query);
  const eligibleTerms = useMemo(() => analysis.terms.filter((term) => term.count >= minimum && (kind === "all" || term.kind === kind) && (!normalized || term.label.includes(normalized) || term.variants.some((v) => v.includes(normalized)))), [analysis.terms, minimum, kind, normalized]);
  const shownTerms = useMemo(() => {
    const base = eligibleTerms.slice(0, limit);
    const pinned = selected && analysis.terms.find((term) => term.id === selected);
    return pinned && !base.some((term) => term.id === selected) ? [...base.slice(0, limit - 1), pinned] : base;
  }, [eligibleTerms, limit, selected, analysis.terms]);
  const edgeSets = useMemo(() => networkEdges(shownTerms, curationAvailable ? curation.links : [], analysis.aliases, edgeMinimum), [shownTerms, curation.links, analysis.aliases, edgeMinimum, curationAvailable]);
  const edges = useMemo(() => [...edgeSets.documented.slice(0, shownTerms.length * (moreEdges ? 4 : 2)), ...(editorialVisible ? edgeSets.interpreted : [])], [edgeSets, shownTerms.length, moreEdges, editorialVisible]);
  const selectedTerm = analysis.terms.find((term) => term.id === selected);
  const selectedEdge = edges.find((edge) => edge.id === selected);
  const activeCategories = curationAvailable ? curation.categories.filter((c) => !c.archived) : [];
  const highlighted = useMemo(() => {
    const current = curation.categories.find((c) => c.id === highlightCategory && !c.archived);
    if (!curationAvailable || !current) return null;
    return new Set(analysis.terms.filter((term) => term.variants.some((v) => current.terms.includes(v)) || current.terms.includes(term.id)).map((term) => term.id));
  }, [curation.categories, highlightCategory, analysis.terms, curationAvailable]);
  const colors = useMemo(() => {
    const result = new Map<string, string>();
    if (!curationAvailable) return result;
    for (const term of analysis.terms) {
      const categories = curation.categories.filter((c) => !c.archived && term.variants.some((v) => c.terms.includes(v)));
      const color = categories.find((c) => c.id === highlightCategory)?.color || categories[0]?.color;
      if (color) result.set(term.id, color);
    }
    return result;
  }, [analysis.terms, curation.categories, highlightCategory, curationAvailable]);
  const materialCategories = [...new Set(contributions.map((c) => c.category))].sort((a, b) => a.localeCompare(b, "da"));

  useEffect(() => {
    if (!selected) return;
    requestAnimationFrame(() => details.current?.focus({ preventScroll: true }));
  }, [selected]);

  const save: SaveCuration = async (resource, method, values) => {
    setSaving(true); setCurationError(""); setMessage("");
    try {
      const row = await read(await fetch("/api/sjaelen/kuratering", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, resource }) }));
      setCuration((current) => ({ ...current, [resource]: method === "DELETE" ? current[resource].filter((item) => item.id !== row.id) : method === "POST" ? [...current[resource], row] : current[resource].map((item) => item.id === row.id ? row : item) }));
      setMessage(method === "DELETE" ? "Kurateringen er fjernet. De oprindelige bidrag er bevaret." : "Kurateringen er gemt.");
    } catch (error) { setCurationError(error instanceof Error ? error.message : "Kunne ikke gemme."); throw error; }
    finally { setSaving(false); }
  };
  function clearFilters() { setCategory(""); setQuery(""); setKind("all"); setMinimum(2); setSelected(null); }
  const view = { category, query, kind, minimum, edgeMinimum, limit, moreEdges, editorialVisible, highlightCategory };
  const networkHref = soulViewHref(view);

  return <div className={`soul-page ${manage ? "soul-management-page" : "soul-stage-page"}`}>
    {manage ? <>
      <header className="soul-topbar"><Link href={networkHref}>← Tilbage til ordnetværket</Link><span>SJÆLEN</span></header>
      <section className="soul-management-header"><h1>Kuratering & visning<span>.</span></h1><p>Indstil netværkets udsnit og organisér jeres foreløbige fortolkninger.</p></section>
    </> : <>
      <h1 className="soul-visually-hidden">SJÆLEN · Ordnetværk</h1>
      <div className="soul-stage-toolbar"><span aria-live="polite">{loading ? "Henter materiale …" : dataError ? "Materialet kunne ikke læses" : `${analysis.contributions.length} bidrag · ${shownTerms.length} ord og vendinger`}</span><div className="soul-stage-links"><Link href="/sjaelen/ordsky">Ordsky <UiIcon name="arrow" /></Link><Link href="/sjaelen/leg-med-ord">Leg med ord <UiIcon name="arrow" /></Link><Link href={soulViewHref(view, true)}>Kuratering & visning <UiIcon name="arrow" /></Link></div></div>
    </>}
    {manage && <div className="soul-material-bar"><span className="soul-material-chip">● Citater & spørgeskemasvar</span><strong aria-live="polite">{loading ? "Henter materiale …" : dataError ? "Materialet kunne ikke læses" : `${analysis.contributions.length} bidrag i denne visning`}</strong><span>Citattekst og alle fritekstsvar fra spørgeskemaet analyseres</span><button className="soul-text-button" onClick={() => { setSelected(null); void loadMaterial(); }} disabled={loading}>Opdatér materiale <UiIcon name="refresh" /></button></div>}
    {curationError && !curationAvailable && <p className="soul-message error" role="alert">{curationError} <button className="soul-text-button" onClick={() => void loadCuration()}>Prøv igen</button></p>}
    {manage && <>
    <div className="soul-controls">
      <label className="soul-search"><span>Søg ord eller vending</span><input type="search" placeholder="Hvad leder du efter?" value={query} onChange={(event) => { setQuery(event.target.value); if (event.target.value) setMinimum(1); setSelected(null); }} /></label>
      <label>Materialets kategori<select value={category} onChange={(event) => { setCategory(event.target.value); setSelected(null); }}><option value="">Alle kategorier</option>{materialCategories.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Vis<select value={kind} onChange={(event) => { setKind(event.target.value); setSelected(null); }}><option value="all">Ord & vendinger</option><option value="word">Enkeltord</option><option value="phrase">Gentagne vendinger</option>{curation.synonyms.length > 0 && <option value="group">Manuelle grupper</option>}</select></label>
      <label>Mindst bidrag<select value={minimum} onChange={(event) => { setMinimum(Number(event.target.value)); setSelected(null); }}>{[1, 2, 3, 5].map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      <label>Antal ord<select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>{[20, 30, 40].map((n) => <option key={n}>{n}</option>)}</select></label>
    </div>

    {activeCategories.length > 0 && <div className="soul-category-highlights"><span>Vores fortolkninger</span><button aria-pressed={!highlightCategory} onClick={() => setHighlightCategory("")}>Alle ord</button>{activeCategories.map((c) => <button key={c.id} title={c.description} aria-pressed={highlightCategory === c.id} onClick={() => setHighlightCategory(highlightCategory === c.id ? "" : c.id)}><i style={{ background: c.color }} />{c.name}</button>)}</div>}
    {highlightCategory && activeCategories.some((c) => c.id === highlightCategory) && <p className="soul-small soul-category-description">{activeCategories.find((c) => c.id === highlightCategory)?.description || "Foreløbig redaktionel kategori."} Andre ord dæmpes; de dokumenterede forbindelser bevares.</p>}

    </>}
    {!manage && <section className={`soul-exploration ${selectedTerm || selectedEdge ? "has-detail" : ""}`} aria-label="Udforsk ordene">
      <div className="soul-map-area">
        {loading ? <div className="soul-map-empty" role="status"><span className="soul-empty-symbol"><UiIcon name="soul" /></span><h2>Vi finder ordene i materialet …</h2></div> : dataError ? <div className="soul-map-empty" role="alert"><h2>Ordene kan ikke læses lige nu</h2><p>{dataError}</p><button className="soul-primary" onClick={() => void loadMaterial()}>Hent materiale igen</button></div> : !contributions.length ? <div className="soul-map-empty"><span className="soul-empty-symbol">“</span><h2>Det begynder med en stemme</h2><p>Når et citat eller spørgeskemasvar er tilføjet, bliver det til ord og forbindelser her. Netværket bygger alene på jeres materiale.</p><Link className="soul-primary" href="/citater">Tilføj et citat <UiIcon name="arrow" /></Link></div> : !shownTerms.length ? <div className="soul-map-empty"><h2>{kind === "phrase" ? "Ingen gentagne vendinger i dette udsnit" : "Ingen ord matcher dette udsnit"}</h2><p>Prøv en anden søgning, en anden materialekategori eller sænk minimum til ét bidrag. Vendinger skal findes i mindst to forskellige bidrag.</p><button className="soul-text-button" onClick={clearFilters}>Nulstil filtre</button><button className="soul-primary" onClick={() => { setMinimum(1); setQuery(""); setKind("all"); }}>Medtag ord fra ét bidrag</button></div> : <SoulNetwork terms={shownTerms} edges={edges} highlighted={highlighted} selectedId={selected} onTerm={setSelected} onEdge={setSelected} reset={0} colors={colors} />}
        <p className="soul-stage-help" id="soul-network-help">Træk i ordene · Klik for at læse bidragene<span className="soul-visually-hidden">. Tastatur: Tab til et ord, Enter for detaljer, piletaster for placering, Escape for at slippe.</span></p>
      </div>
      {(selectedTerm || selectedEdge) && <div ref={details} tabIndex={-1} className="soul-detail-wrapper"><SoulDetail term={selectedTerm} edge={selectedEdge} contributions={analysis.contributions} onClose={() => setSelected(null)} /></div>}
    </section>}
    {!manage && <p className="soul-stage-key">Areal = antal bidrag <span>·</span> Fuld linje = fælles bidrag <span>·</span> Stiplet linje = redaktionel forbindelse</p>}
    {manage && <>
    <div className="soul-line-controls"><label>Fælles bidrag bag en fuld linje<select value={edgeMinimum} onChange={(event) => { setEdgeMinimum(Number(event.target.value)); setSelected(null); }}>{[1, 2, 3, 5].map((n) => <option key={n} value={n}>Mindst {n}</option>)}</select></label><label className="soul-check"><input type="checkbox" checked={moreEdges} onChange={(event) => setMoreEdges(event.target.checked)} />Vis flere dokumenterede linjer</label><label className="soul-check"><input type="checkbox" checked={editorialVisible} onChange={(event) => { setEditorialVisible(event.target.checked); setSelected(null); }} />Vis redaktionelle linjer</label><span>{edges.filter((edge) => edge.kind === "documented").length} af {edgeSets.documented.length} dokumenterede linjer vises</span></div>
    <div className="soul-view-apply"><p>{analysis.contributions.length} bidrag · {Math.min(limit, eligibleTerms.length)} af {eligibleTerms.length} matchende ord og vendinger</p><div className="soul-view-actions"><Link className="soul-text-button" href={networkHref}>Nulstil placering <UiIcon name="refresh" /></Link><Link className="soul-primary" href={networkHref}>Vis ordnetværket <UiIcon name="arrow" /></Link></div></div>
    <div className="soul-reading-key"><div><i className="soul-key-circle" /><p><strong>Størrelsen følger bidragene</strong>Cirklens areal følger antallet af forskellige bidrag med ordet. En gentagelse i samme bidrag tæller ikke ekstra.</p></div><div><i className="soul-key-line" /><p><strong>Fuld linje · dokumenteret</strong>Ordene optræder i samme bidrag. En stærkere linje betyder flere fælles bidrag.</p></div><div><i className="soul-key-line editorial" /><p><strong>Stiplet linje · redaktionel</strong>En forbindelse, vi selv har fortolket og beskrevet. Placeringen i kortet er en udforskningshjælp, ikke en måling.</p></div></div>

    <details className="soul-method"><summary>Sådan læser og tæller vi materialet <span>+</span></summary><div><p>Ét citat eller ét udfyldt fritekstfelt fra spørgeskemaet er ét bidrag. Alle spørgsmål med fritekst indgår, også tidligere ordsvar. Den faste start “Aalborg Karneval er…” og det strukturerede nej-valg ved traditioner tælles ikke med. Svarfelter fra samme besvarelse tælles hver for sig og forbindes ikke på tværs. Kun tekstfeltet analyseres; navn, kilde, dato, kategori og afsender indgår ikke i optællingen. Store og små bogstaver og tegnsætning normaliseres. Almindelige danske fyldord sorteres fra med en redigerbar stopordsliste i projektet. Ordene bøjes ikke om og samles ikke automatisk.</p><p>Vendinger er sammenhængende sekvenser på 2–4 ord, der findes i mindst to forskellige bidrag. De krydser ikke tegnsætning eller linjeskift. Vendinger med kun fyldord udelades. Manuelle variantgrupper tælles som en union af bidragene, så samme bidrag ikke tæller dobbelt. Procenter bruger altid antallet af læsbare bidrag i den valgte materialekategori.</p><p>De mest gennemgående ord vises først. Som udgangspunkt vises højst dobbelt så mange dokumenterede linjer som ord, prioriteret efter flest fælles bidrag. “Antal ord” i visningsindstillingerne udvider udsnittet. Ingen tekster sendes til en ekstern model eller fortolkningstjeneste.</p></div></details>
    <section className="soul-future"><span className="soul-kicker">ET GRUNDLAG, DER KAN VOKSE</span><div><h2>Flere stemmer, når materialet er klar.</h2><p>Netværket bruger citater og alle fritekstsvar fra Den digitale sjæl. Workshopmateriale er endnu ikke tilknyttet. Kilderegisterets URL’er og PDF’er analyseres ikke i denne version.</p></div><div className="soul-future-types"><span>Spørgeskemaer <small>Alle fritekstsvar indgår</small></span><span>Workshopmateriale <small>Afventer datakilde</small></span><span>Kilder & PDF’er <small>Ikke med i analysen</small></span></div></section>
    <div id="soul-curation-panel">{curationAvailable && <><p className="soul-small">Kurateringen deles med alle, der har adgang til SJÆLEN via sitets password.</p>{message && <p className="soul-message" role="status">{message}</p>}<SoulCuration curation={curation} terms={rawAnalysis.terms} contributions={rawAnalysis.contributions} save={save} busy={saving} error={curationError} onReload={() => void loadCuration()} /></>}</div>
    <footer className="soul-footer"><Link href={networkHref}>← Tilbage til ordnetværket</Link></footer>
    </>}
  </div>;
}
