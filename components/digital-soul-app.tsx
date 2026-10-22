"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SURVEY_QUESTIONS, type SurveyResponse } from "@/lib/survey";
import { ARCHIVE_AGES, ARCHIVE_SORTS, ARCHIVE_PAGE_SIZE } from "@/lib/survey-archive";
import { fetchJson } from "@/lib/fetch-json";
import UiIcon from "./ui-icon";
import styles from "./digital-soul-app.module.css";
import VoicePicker from "./voice-picker";
import { QUOTE_DRAFT_KEY, surveyAnswerKey, surveyQuoteDraft } from "@/lib/quote-draft";
import type { VoiceTarget } from "@/lib/digital-voices";

const date = (value: string) => new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Copenhagen" }).format(new Date(value));
export default function DigitalSoulApp({ initialResponseId = "" }: { initialResponseId?: string }) {
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteSaving, setFavoriteSaving] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState("");
  const favoriteDirty = useRef(false);
  const [quoteStatus, setQuoteStatus] = useState<{ response: string; ids: Record<string, string>; error: string } | null>(null);
  const [quoteReload, setQuoteReload] = useState(0);
  const [voiceTarget, setVoiceTarget] = useState<VoiceTarget | null>(null);
  const [responseId, setResponseId] = useState(initialResponseId);
  const openLinkedResponse = useRef(Boolean(initialResponseId));
  const [rows, setRows] = useState<SurveyResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [matched, setMatched] = useState(0);
  const [averageAge, setAverageAge] = useState<number | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [age, setAge] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const deleteInput = useRef<HTMLInputElement>(null);
  const [reload, setReload] = useState(0);
  const pendingSelection = useRef<number | null>(null);
  const scrollToCollection = useRef(false);
  const collectionHeading = useRef<HTMLHeadingElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const readerTop = useRef<HTMLDivElement>(null);
  const readerTitle = useRef<HTMLHeadingElement>(null);
  const searchPending = search !== query;

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search); setPage(0); }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    setSummaryLoading(true); setSummaryError("");
    fetchJson<{ total: number; averageAge: number | null }>("/api/den-digitale-sjael?summary=1", controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setTotal(data.total); setAverageAge(data.averageAge);
    }).catch(failure => { if (!controller.signal.aborted) setSummaryError(failure.message); }).finally(() => { if (!controller.signal.aborted) setSummaryLoading(false); });
    return () => controller.abort();
  }, [reload]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setSelected(null);
    const params = new URLSearchParams({ page: String(page), q: query, sort, age, response: responseId, favorites: favoritesOnly ? "1" : "0" });
    fetchJson<{ rows: SurveyResponse[]; matched: number }>(`/api/den-digitale-sjael?${params}`, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setRows(data.rows);
      if (openLinkedResponse.current) { setSelected(data.rows.length ? 0 : null); openLinkedResponse.current = false; }
      if (pendingSelection.current !== null) { setSelected(pendingSelection.current === -1 ? data.rows.length - 1 : 0); pendingSelection.current = null; }
      setMatched(data.matched);
    }).catch(failure => { if (!controller.signal.aborted) setError(failure.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, query, sort, age, reload, responseId, favoritesOnly]);
  useEffect(() => {
    if (selected !== null) {
      if (!dialog.current?.open) dialog.current?.showModal();
      readerTop.current?.scrollTo({ top: 0, behavior: "instant" });
      readerTitle.current?.focus({ preventScroll: true });
    } else dialog.current?.close();
  }, [selected]);
  useEffect(() => {
    if (selected === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [selected]);
  useEffect(() => {
    if (!loading && scrollToCollection.current) {
      collectionHeading.current?.scrollIntoView({ block: "start", behavior: "instant" });
      scrollToCollection.current = false;
    }
  }, [loading]);
  useEffect(() => { setConfirmDelete(false); setDeleteText(""); setDeleteError(""); }, [selected]);
  useEffect(() => { if (confirmDelete) deleteInput.current?.focus(); }, [confirmDelete]);
  const current = selected === null ? null : rows[selected];
  const currentResponseId = current?.id;
  useEffect(() => {
    if (!currentResponseId) return;
    const controller = new AbortController();
    setQuoteStatus(null);
    fetchJson<{ id: string; survey_answer_key: string }[]>(`/api/citater?survey_response=${encodeURIComponent(currentResponseId)}`, controller.signal)
      .then(items => setQuoteStatus({ response: currentResponseId, ids: Object.fromEntries(items.map(item => [item.survey_answer_key, item.id])), error: "" }))
      .catch(() => { if (!controller.signal.aborted) setQuoteStatus({ response: currentResponseId, ids: {}, error: "Citatstatus kunne ikke hentes." }); });
    return () => controller.abort();
  }, [currentResponseId, quoteReload]);
  const pageCount = Math.max(1, Math.ceil(matched / ARCHIVE_PAGE_SIZE));
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index).filter(index => pageCount <= 7 || index === 0 || index === pageCount - 1 || Math.abs(index - page) <= 1);
  const pending = loading || searchPending;
  const filtered = Boolean(responseId || search || age !== "all" || favoritesOnly);
  async function deleteResponse() {
    if (!current || deleteText !== "SLET" || deleting) return;
    const target = current;
    setDeleting(true); setDeleteError("");
    try {
      const response = await fetch("/api/den-digitale-sjael", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: target.id, confirmation: deleteText }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Besvarelsen kunne ikke slettes.");
      dialog.current?.close(); setSelected(null); pendingSelection.current = null;
      setNotice(`Besvarelsen fra ${target.first_name} er slettet.`);
      if (rows.length === 1 && page > 0) setPage(value => value - 1);
      setReload(value => value + 1);
      collectionHeading.current?.focus({ preventScroll: true });
    } catch (failure) { setDeleteError(failure instanceof Error ? failure.message : "Besvarelsen kunne ikke slettes."); }
    finally { setDeleting(false); }
  }
  useEffect(() => {
    if (selected === null && favoriteDirty.current) {
      favoriteDirty.current = false;
      if (favoritesOnly && !rows.some(row => row.is_favorite) && page > 0) setPage(value => value - 1);
      setReload(value => value + 1);
    }
  }, [selected]);
  async function toggleFavorite(row: SurveyResponse) {
    if (favoriteSaving) return;
    setFavoriteSaving(row.id); setFavoriteError("");
    try {
      const response = await fetch("/api/den-digitale-sjael", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, is_favorite: !row.is_favorite }), signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Favoritten kunne ikke gemmes.");
      setRows(items => items.map(item => item.id === result.id ? { ...item, is_favorite: result.is_favorite } : item));
      if (favoritesOnly && !result.is_favorite) {
        if (selected !== null) favoriteDirty.current = true;
        else { if (rows.length === 1 && page > 0) setPage(value => value - 1); setReload(value => value + 1); }
      }
    } catch (failure) { setFavoriteError(failure instanceof Error ? failure.message : "Favoritten kunne ikke gemmes."); }
    finally { setFavoriteSaving(null); }
  }
  function favoriteButton(row: SurveyResponse, inReader = false) {
    return <button type="button" className={`${styles.favoriteButton}${inReader ? ` ${styles.readerFavorite}` : ""}`} aria-pressed={Boolean(row.is_favorite)} aria-label={`${row.is_favorite ? "Fjern fra" : "Tilføj til"} favoritter: ${row.first_name}, ${row.age} år`} title={row.is_favorite ? "Fjern favorit" : "Markér som favorit"} disabled={favoriteSaving !== null} onClick={() => { void toggleFavorite(row); }}><UiIcon name="star" /></button>;
  }
  function changePage(direction: number) { scrollToCollection.current = true; setPage(value => value + direction); }
  function reset() { setFavoritesOnly(false); setSearch(""); setQuery(""); setAge("all"); setPage(0); setResponseId(""); window.history.replaceState(null, "", "/den-digitale-sjael"); }
  function move(direction: number) {
    const next = (selected ?? 0) + direction;
    if (next < 0 || next >= rows.length) {
      pendingSelection.current = direction === -1 ? -1 : 0;
      setPage(value => value + direction);
    } else setSelected(next);
  }
  function changeSort(value: string) { setSort(value); setPage(0); }

  return <div className={styles.archive}>
    <header className={styles.header}>
      <div><span className={styles.eyebrow}>MENNESKENE BAG KARNEVALLET</span><h1>Den digitale sjæl<span>.</span></h1><p>Find en stemme. Læs en historie. Bliv klogere på vores karneval.</p></div>
      <div className={styles.headerActions}><Link className={styles.outlineButton} href="/sjaelen/digitale-stemmer">Digitale stemmer <UiIcon name="arrow" /></Link><Link className={styles.outlineButton} href="/den-digitale-sjael/analyse">Analyse <UiIcon name="arrow" /></Link><a className={styles.outlineButton} href="https://karneval.karmanaut.dk/sjaelen" target="_blank" rel="noopener noreferrer">Åbn spørgeskema <UiIcon name="arrow" /></a></div>
    </header>

    <section className={styles.overview} aria-label="Nøgletal for alle besvarelser">
      <dl className={styles.metrics}><div><dt>Besvarelser i alt</dt><dd>{summaryError || summaryLoading ? "—" : total}</dd></div><div><dt>Gennemsnitsalder</dt><dd>{summaryError || summaryLoading || averageAge === null ? "—" : <>{new Intl.NumberFormat("da-DK", { maximumFractionDigits: 1 }).format(averageAge)} <span>år</span></>}</dd></div></dl>
      <div className={styles.overviewNote}><p>Hver besvarelse er et menneskes<br />helt eget Aalborg Karneval.</p><button className={styles.refresh} disabled={pending || summaryLoading} onClick={() => setReload(value => value + 1)}><UiIcon name="refresh" />{loading || summaryLoading ? "Opdaterer …" : "Opdatér svar"}</button></div>
    </section>

    {summaryError && <p className={styles.notice} role="alert">Nøgletallene kunne ikke hentes. {summaryError} <button className={styles.textButton} onClick={() => setReload(value => value + 1)}>Prøv igen</button></p>}
    <section className={styles.collection} aria-labelledby="archive-title">
      <div className={styles.collectionHeading}><h2 id="archive-title" ref={collectionHeading} tabIndex={-1}>Alle stemmer<span aria-live="polite">{pending ? "Henter …" : error ? "" : `${matched} ${filtered ? "fundet" : "besvarelser"}`}</span></h2>{filtered && <button className={styles.textButton} onClick={reset}>Nulstil filtre <UiIcon name="close" /></button>}</div>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      <div className={styles.favoriteToolbar}><button type="button" className={styles.favoriteFilter} aria-pressed={favoritesOnly} onClick={() => { setFavoritesOnly(value => !value); setPage(0); }}><UiIcon name="star" /> Kun favoritter</button><span>Stjernemarkér de besvarelser, I vil vende tilbage til.</span></div>
      {favoriteError && <p className={styles.notice} role="alert">{favoriteError}</p>}
      <div className={styles.filters}>
        <label>Søg i svar og fornavne<div className={styles.search}><input type="search" value={search} maxLength={80} placeholder="Søg fx fællesskab, udklædning eller et fornavn" onChange={event => setSearch(event.target.value)} /></div></label>
        <label>Alder<select value={age} onChange={event => { setAge(event.target.value); setPage(0); }}>{Object.entries(ARCHIVE_AGES).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>
        <label>Sortér efter<select value={sort} onChange={event => changeSort(event.target.value)}>{Object.entries(ARCHIVE_SORTS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>
      </div>

      {error ? <div className={styles.empty} role="alert"><h3>Svarene kunne ikke hentes</h3><p>{error}</p><button className={styles.outlineButton} onClick={() => setReload(value => value + 1)}>Prøv igen</button></div> : pending ? <div className={styles.empty} role="status">Henter besvarelser …</div> : !rows.length ? <div className={styles.empty}><h3>{filtered ? "Ingen stemmer matcher din søgning" : "Her begynder fortællingen"}</h3><p>{filtered ? "Prøv et andet ord, et fornavn eller en anden aldersgruppe." : "Når den første besvarelse lander, kan du læse den her."}</p>{filtered && <button className={styles.outlineButton} onClick={reset}>Vis alle besvarelser</button>}</div> : <>
        <table className={styles.table}><caption className={styles.srOnly}>Besvarelser fra spørgeskemaet. Vælg Læs svar for at åbne en besvarelse.</caption><thead><tr><th scope="col" aria-sort={sort === "name" ? "ascending" : "none"}><button onClick={() => changeSort("name")}>Fornavn {sort === "name" && "↓"}</button></th><th scope="col" aria-sort={sort === "youngest" ? "ascending" : sort === "eldest" ? "descending" : "none"}><button onClick={() => changeSort(sort === "youngest" ? "eldest" : "youngest")}>Alder {sort === "youngest" ? "↑" : sort === "eldest" ? "↓" : "↕"}</button></th><th scope="col" aria-sort={sort === "participations" ? "descending" : "none"}><button onClick={() => changeSort("participations")}>Deltagelser {sort === "participations" && "↓"}</button></th><th scope="col" aria-sort={sort === "newest" ? "descending" : sort === "oldest" ? "ascending" : "none"}><button onClick={() => changeSort(sort === "newest" ? "oldest" : "newest")}>Modtaget {sort === "newest" ? "↓" : sort === "oldest" ? "↑" : "↕"}</button></th><th scope="col"><span className={styles.srOnly}>Åbn besvarelse</span></th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={row.id}><th scope="row"><div className={styles.respondentName}>{favoriteButton(row)}<button className={styles.nameButton} onClick={() => setSelected(index)}>{row.first_name}</button></div></th><td data-label="Alder">{row.age} år</td><td data-label="Deltagelser">{row.participations} gange</td><td data-label="Modtaget"><time dateTime={row.created_at}>{date(row.created_at)}</time></td><td><button className={styles.readButton} aria-label={`Læs svar fra ${row.first_name}, ${row.age} år`} onClick={() => setSelected(index)}>Læs svar <UiIcon name="arrow" /></button></td></tr>)}</tbody>
        </table>
        <nav className={styles.pagination} aria-label="Sider med besvarelser"><p>{page * ARCHIVE_PAGE_SIZE + 1}–{page * ARCHIVE_PAGE_SIZE + rows.length} af {matched}</p><div><button className={styles.outlineButton} disabled={page === 0} onClick={() => changePage(-1)}>← Forrige</button><div className={styles.pageNumbers}>{pageNumbers.map((number, index) => <span key={number}>{index > 0 && number - pageNumbers[index - 1] > 1 && <span className={styles.pageGap} aria-hidden="true">…</span>}<button type="button" className={styles.pageNumber} aria-label={`Side ${number + 1}`} aria-current={number === page ? "page" : undefined} onClick={() => changePage(number - page)}>{number + 1}</button></span>)}</div><button className={styles.outlineButton} disabled={(page + 1) * ARCHIVE_PAGE_SIZE >= matched} onClick={() => changePage(1)}>Næste →</button></div>{pageCount > 7 && <label className={styles.pageJump}>Gå til side<select value={page} onChange={event => changePage(Number(event.target.value) - page)}>{Array.from({ length: pageCount }, (_, number) => <option key={number} value={number}>{number + 1}</option>)}</select></label>}</nav>
      </>}
    </section>

    <dialog className={styles.reader} ref={dialog} aria-labelledby="response-title" onClose={() => { if (!dialog.current?.open) setSelected(null); }} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      {current && <div className={styles.readerContent} ref={readerTop}>
        <div className={styles.readerBar}><div className={styles.readerIdentity}><span>Besvarelse {page * ARCHIVE_PAGE_SIZE + (selected ?? 0) + 1} af {matched}</span><span className={styles.readerName}>{current.first_name} · {current.age} år</span></div><div className={styles.readerBarActions}>{favoriteButton(current, true)}<button className={styles.closeButton} disabled={deleting} onClick={() => dialog.current?.close()} aria-label="Luk besvarelse"><UiIcon name="close" /></button></div></div>
        <header className={styles.person}><span className={styles.eyebrow}>ET MENNESKES KARNEVAL</span><h2 id="response-title" ref={readerTitle} tabIndex={-1}>{current.first_name}<span>{current.age} år</span></h2><dl><div><dt>Modtaget</dt><dd>{date(current.created_at)}</dd></div><div><dt>Postnummer</dt><dd>{current.postal_code}</dd></div><div><dt>Deltaget</dt><dd>Cirka {current.participations} gange</dd></div></dl></header>
        {quoteStatus?.response === current.id && quoteStatus.error && <p className={styles.notice} role="alert">{quoteStatus.error} <button className={styles.textButton} onClick={() => setQuoteReload(value => value + 1)}>Prøv igen</button></p>}
        {favoriteError && <p className={styles.notice} role="alert">{favoriteError}</p>}<article className={styles.answers}>{SURVEY_QUESTIONS.filter(question => question.id !== "words" || current.answers.words?.length).map((question, index) => <section key={question.id}><h3><span>{String(index + 1).padStart(2, "0")}</span>{question.title}</h3><div>{current.answers[question.id]?.length ? current.answers[question.id].map((answer, i) => <div key={i}><button className={styles.selectAnswer} aria-label={`Tilføj svar ${i + 1} til SJÆL: ${question.title}`} onClick={() => setVoiceTarget({ response_id: current.id, question_id: question.id, answer_index: i, text: answer })}><span className={styles.answerText}>{question.kind === "sentences" ? "Aalborg Karneval er… " : ""}{answer}</span><span className={styles.answerAction}>Tilføj til SJÆL <UiIcon name="arrow" /></span></button>{current.publication_permission && <button type="button" className={styles.quoteAction} disabled={quoteStatus?.response !== current.id || Boolean(quoteStatus.error)} onClick={() => { const key = surveyAnswerKey(current.id, question.id, i); const existing = quoteStatus?.ids[key]; if (existing) { window.location.assign(`/citater#citat-${existing}`); return; } try { sessionStorage.setItem(QUOTE_DRAFT_KEY, JSON.stringify({ ...surveyQuoteDraft(answer, current.first_name, current.age, question.kind === "sentences"), survey_answer_key: key })); window.location.assign("/citater?opret=1"); } catch { setNotice("Citatet kunne ikke overføres. Prøv at tillade browserens lokale lager."); } }}>{quoteStatus?.response !== current.id ? "Tjekker citatstatus…" : quoteStatus.ids[surveyAnswerKey(current.id, question.id, i)] ? <>Allerede tilføjet · Se citat <UiIcon name="check" /></> : <>Tilføj som citat <UiIcon name="arrow" /></>}</button>}</div>) : <p className={styles.unanswered}>Ikke besvaret</p>}</div></section>)}</article>
        <footer className={styles.readerFooter}><p>{current.publication_permission ? "Må citeres med fornavn og alder." : "Må ikke citeres offentligt."}<br />{current.contact_permission ? "Har sagt ja til senere kontakt." : "Ønsker ikke senere kontakt."}</p><div><button className={styles.outlineButton} disabled={deleting || (page === 0 && selected === 0)} onClick={() => move(-1)}>← Forrige svar</button><button className={styles.readButton} disabled={deleting || page * ARCHIVE_PAGE_SIZE + (selected ?? 0) + 1 >= matched} onClick={() => move(1)}>Næste svar →</button></div><button className={styles.textButton} disabled={deleting} onClick={() => dialog.current?.close()}>Tilbage til overblikket</button>
          <section className={styles.deleteArea} aria-label="Slet besvarelse">
            {confirmDelete ? <>
              <h3>Slet besvarelsen fra {current.first_name}, {current.age} år?</h3>
              <p>Alle svar og tilknyttede kontaktoplysninger slettes permanent. Det kan ikke fortrydes.</p>
              <label htmlFor="delete-survey-confirmation">Skriv <strong>SLET</strong> for at bekræfte</label>
              <input id="delete-survey-confirmation" ref={deleteInput} value={deleteText} disabled={deleting} onChange={event => setDeleteText(event.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} />
              {deleteError && <p role="alert">{deleteError}</p>}
              <div><button className={styles.outlineButton} disabled={deleting} onClick={() => { setConfirmDelete(false); setDeleteText(""); setDeleteError(""); }}>Annuller</button><button className={styles.readButton} disabled={deleting || deleteText !== "SLET"} onClick={() => void deleteResponse()}>{deleting ? "Sletter …" : "Slet permanent"}</button></div>
            </> : <button className={styles.deleteTrigger} disabled={deleting} onClick={() => setConfirmDelete(true)}>Slet besvarelse</button>}
          </section>
        </footer>
      </div>}
      {voiceTarget && <VoicePicker key={`${voiceTarget.response_id}:${voiceTarget.question_id}:${voiceTarget.answer_index}`} target={voiceTarget} onClose={() => setVoiceTarget(null)} onSaved={() => setNotice("Temaerne er gemt i Digitale stemmer.")} />}
    </dialog>
  </div>;
}
