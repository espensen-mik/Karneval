"use client";

import UiIcon from "./ui-icon";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { analyzeContributions, normalizeTerm } from "@/lib/soul-analysis";
import { EMPTY_WORD_PLAY, mergeWordBubbles, readWordPlay, removeWordBubble, WORD_PLAY_STORAGE, wordPlayBubbles } from "@/lib/word-play";
import type { WordPlay } from "@/lib/word-play";
import type { Contribution } from "@/lib/soul-types";
import SoulDetail from "./soul-detail";
import WordPlayCanvas from "./word-play-canvas";

export default function WordPlayApp() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [play, setPlay] = useState<WordPlay>(EMPTY_WORD_PLAY);
  const [history, setHistory] = useState<WordPlay[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(30);

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/sjaelen", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Citaterne kunne ikke hentes.");
      setContributions(data);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Materialet kunne ikke læses."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    void load();
    try {
      const saved = localStorage.getItem(WORD_PLAY_STORAGE);
      if (saved) setPlay(readWordPlay(JSON.parse(saved)));
    } catch { setStorageError("Den gemte leg kunne ikke læses. Du kan stadig lege videre i denne session."); }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(WORD_PLAY_STORAGE, JSON.stringify(play)); setStorageError(""); }
    catch { setStorageError("Browseren kunne ikke gemme legen. Dine ændringer findes stadig i denne session."); }
  }, [play, hydrated]);

  const analysis = useMemo(() => analyzeContributions(contributions), [contributions]);
  const bubbles = useMemo(() => wordPlayBubbles(analysis.terms, play), [analysis.terms, play]);
  const scaleCount = Math.max(1, ...analysis.terms.filter((term) => term.kind === "word").map((term) => term.count));
  const normalized = normalizeTerm(query);
  const matches = useMemo(() => bubbles.filter((bubble) => !normalized || normalizeTerm(bubble.label).includes(normalized) || bubble.variants.some((word) => word.includes(normalized))), [bubbles, normalized]);
  const shown = useMemo(() => matches.slice(0, limit), [matches, limit]);
  const selectedBubble = bubbles.find((bubble) => bubble.id === selected);
  const ready = hydrated && !loading && !error;

  function update(next: WordPlay, message: string) {
    setHistory((previous) => [...previous.slice(-29), play]); setPlay(next);
    setSelected(null); setMergeTarget(""); setAnnouncement(message);
  }
  function merge(sourceId: string, targetId: string) {
    const source = bubbles.find((bubble) => bubble.id === sourceId), target = bubbles.find((bubble) => bubble.id === targetId);
    if (!source || !target || sourceId === targetId) return;
    update(mergeWordBubbles(play, source, target), `“${source.label}” og “${target.label}” er samlet. Hvert citat tæller højst én gang.`);
    setSelected(target.id);
  }
  function remove(id: string) {
    const bubble = bubbles.find((bubble) => bubble.id === id);
    if (bubble) update(removeWordBubble(play, bubble), `“${bubble.label}” er fjernet fra legen. Du kan fortryde.`);
  }
  function undo() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setPlay(previous); setHistory(history.slice(0, -1)); setSelected(null); setMergeTarget(""); setAnnouncement("Den sidste handling er fortrudt.");
  }

  return <div className="soul-page soul-stage-page word-play-page">
    <header className="word-play-toolbar">
      <div><h1>Leg med ord<span>.</span></h1><span className="word-play-subtitle">{loading ? "Henter citater …" : error ? "Materialet kunne ikke læses" : `${analysis.contributions.length} citater · ${bubbles.length} bobler`}</span></div>
      <div className="word-play-actions"><button disabled={!history.length} onClick={undo}>Fortryd <UiIcon name="undo" /></button><button disabled={!ready || (!play.groups.length && !play.excluded.length)} onClick={() => update(EMPTY_WORD_PLAY, "Legen er nulstillet. Alle ord er tilbage.")}>Nulstil</button><Link href="/sjaelen/ordnetvaerk">Ordnetværk <UiIcon name="arrow" /></Link></div>
    </header>
    <div className="word-play-intro"><p>Træk to bobler oven på hinanden for at samle dem. Minus fjerner et ord fra legen.</p><details><summary>Find ord & flere muligheder</summary><div className="word-play-options"><label className="form-field">Søg i ord og grupper<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Fx mennesker eller folk" /></label><label className="form-field">Bobler på fladen<select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>{[20, 30, 40, 60].map((n) => <option key={n}>{n}</option>)}</select></label><button className="soul-text-button" onClick={() => void load()} disabled={loading}>Opdatér citater <UiIcon name="refresh" /></button></div><p>Samlinger og fjernede ord gemmes kun i denne browser. Citaterne, ordnetværket og den fælles kuratering ændres ikke. Du kan også samle bobler via detaljepanelet.</p></details></div>
    {storageError && <p className="soul-message error" role="alert">{storageError}</p>}
    <p className="word-play-announcement" aria-live="polite">{announcement || "Ingen forbindelseslinjer. Kun ord, citater og dine egne samlinger."}</p>
    <section className={`soul-exploration word-play-exploration ${selectedBubble ? "has-detail" : ""}`} aria-label="Legeflade med ordbobler">
      <div className="soul-map-area">
        {loading || !hydrated ? <div className="soul-map-empty" role="status"><span className="soul-empty-symbol">◌</span><h2>Vi finder ordene …</h2></div> : error ? <div className="soul-map-empty" role="alert"><h2>Citaterne kunne ikke læses</h2><p>{error}</p><button className="soul-primary" onClick={() => void load()}>Prøv igen</button></div> : !contributions.length ? <div className="soul-map-empty"><h2>Legen begynder med et citat</h2><p>Boblerne kommer fra de faktiske citattekster.</p><Link className="soul-primary" href="/citater">Tilføj et citat <UiIcon name="arrow" /></Link></div> : !shown.length ? <div className="soul-map-empty"><h2>{query ? "Ingen bobler matcher søgningen" : "Alle ordene er lagt til side"}</h2><p>{query ? "Prøv et andet ord, eller ryd søgningen." : "Fortryd en handling, eller nulstil legen for at få ordene tilbage."}</p><button className="soul-primary" onClick={() => query ? setQuery("") : update(EMPTY_WORD_PLAY, "Alle ord er tilbage.")}>{query ? "Ryd søgning" : "Hent ordene tilbage"}</button></div> : <WordPlayCanvas scaleCount={scaleCount} bubbles={shown} selectedId={selected} onSelect={(id) => { setSelected(id); setMergeTarget(""); }} onMerge={merge} onRemove={remove} />}
        <p className="soul-stage-help" id="word-play-help">{ready ? `${shown.length} af ${matches.length} bobler vises · ` : ""}Klik for bidrag og sammenlægning<span className="soul-visually-hidden">. Tab til en boble. Enter åbner detaljer. Piletaster flytter. Delete eller bobleminus fjerner. Sammenlægning er også tilgængelig med en vælger i detaljerne.</span></p>
      </div>
      {selectedBubble && <div className="soul-detail-wrapper word-play-detail">
        <div className="word-play-group-tools">
          {selectedBubble.kind === "group" && <form key={selectedBubble.id + selectedBubble.label} onSubmit={(event) => {
            event.preventDefault(); const name = String(new FormData(event.currentTarget).get("name") || "").trim();
            if (name) { update({ ...play, groups: play.groups.map((group) => group.id === selectedBubble.id ? { ...group, label: name } : group) }, "Gruppens navn er ændret."); setSelected(selectedBubble.id); }
          }}><label className="form-field">Giv samlingen et navn<input name="name" defaultValue={selectedBubble.label} required maxLength={100} /></label><button className="soul-text-button">Gem navn</button></form>}
          <label className="form-field">Saml med en anden boble<select value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)}><option value="">Vælg ord eller samling</option>{bubbles.filter((bubble) => bubble.id !== selectedBubble.id).map((bubble) => <option key={bubble.id} value={bubble.id}>{bubble.label} · {bubble.count} citater</option>)}</select></label><button className="soul-primary" disabled={!mergeTarget} onClick={() => merge(selectedBubble.id, mergeTarget)}>Slå boblerne sammen</button>
          {selectedBubble.kind === "group" && <button className="soul-text-button" onClick={() => update({ ...play, groups: play.groups.filter((group) => group.id !== selectedBubble.id) }, "Samlingen er delt op i de oprindelige ord igen.")}>Del samlingen op igen</button>}
        </div>
        <SoulDetail term={selectedBubble} contributions={analysis.contributions} onClose={() => setSelected(null)} />
      </div>}
    </section>
    <p className="soul-stage-key">Boblernes areal følger antal forskellige citater · En samling tæller citater med mindst ét af ordene · Gemt lokalt i din browser</p>
  </div>;
}
