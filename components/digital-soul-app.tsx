"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SURVEY_QUESTIONS, type SurveyResponse } from "@/lib/survey";
import { ARCHIVE_AGES, ARCHIVE_SORTS, ARCHIVE_PAGE_SIZE } from "@/lib/survey-archive";
import UiIcon from "./ui-icon";
import styles from "./digital-soul-app.module.css";

const date = (value: string) => new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Copenhagen" }).format(new Date(value));
export default function DigitalSoulApp() {
  const [rows, setRows] = useState<SurveyResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [matched, setMatched] = useState(0);
  const [averageAge, setAverageAge] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [age, setAge] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    setLoading(true); setError(""); setSelected(null);
    const params = new URLSearchParams({ page: String(page), q: query, sort, age });
    fetch(`/api/den-digitale-sjael?${params}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Besvarelserne kunne ikke læses.");
      if (controller.signal.aborted) return;
      setRows(data.rows);
      if (pendingSelection.current !== null) { setSelected(pendingSelection.current === -1 ? data.rows.length - 1 : 0); pendingSelection.current = null; }
      setTotal(data.total); setMatched(data.matched); setAverageAge(data.averageAge);
    }).catch(failure => { if (failure.name !== "AbortError") setError(failure.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, query, sort, age, reload]);
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
  const current = selected === null ? null : rows[selected];
  const pending = loading || searchPending;
  const filtered = Boolean(search || age !== "all");
  function changePage(direction: number) { scrollToCollection.current = true; setPage(value => value + direction); }
  function reset() { setSearch(""); setQuery(""); setAge("all"); setPage(0); }
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
      <Link className={styles.outlineButton} href="/spoergeskema" target="_blank" rel="noopener noreferrer">Åbn spørgeskema <UiIcon name="arrow" /></Link>
    </header>

    <section className={styles.overview} aria-label="Nøgletal for alle besvarelser">
      <dl className={styles.metrics}><div><dt>Besvarelser i alt</dt><dd>{error || loading && !total ? "—" : total}</dd></div><div><dt>Gennemsnitsalder</dt><dd>{error || averageAge === null ? "—" : <>{new Intl.NumberFormat("da-DK", { maximumFractionDigits: 1 }).format(averageAge)} <span>år</span></>}</dd></div></dl>
      <div className={styles.overviewNote}><p>Hver besvarelse er et menneskes<br />helt eget Aalborg Karneval.</p><button className={styles.refresh} disabled={pending} onClick={() => setReload(value => value + 1)}><UiIcon name="refresh" />{loading ? "Opdaterer …" : "Opdatér svar"}</button></div>
    </section>

    <section className={styles.collection} aria-labelledby="archive-title">
      <div className={styles.collectionHeading}><h2 id="archive-title" ref={collectionHeading}>Alle stemmer<span aria-live="polite">{pending ? "Henter …" : error ? "" : `${matched} ${filtered ? "fundet" : "besvarelser"}`}</span></h2>{filtered && <button className={styles.textButton} onClick={reset}>Nulstil filtre <UiIcon name="close" /></button>}</div>
      <div className={styles.filters}>
        <label>Søg efter fornavn<div className={styles.search}><input type="search" value={search} maxLength={80} placeholder="Hvem leder du efter?" onChange={event => setSearch(event.target.value)} /></div></label>
        <label>Alder<select value={age} onChange={event => { setAge(event.target.value); setPage(0); }}>{Object.entries(ARCHIVE_AGES).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>
        <label>Sortér efter<select value={sort} onChange={event => changeSort(event.target.value)}>{Object.entries(ARCHIVE_SORTS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>
      </div>

      {error ? <div className={styles.empty} role="alert"><h3>Svarene kunne ikke hentes</h3><p>{error}</p><button className={styles.outlineButton} onClick={() => setReload(value => value + 1)}>Prøv igen</button></div> : pending ? <div className={styles.empty} role="status">Henter besvarelser …</div> : !rows.length ? <div className={styles.empty}><h3>{filtered ? "Ingen stemmer matcher din søgning" : "Her begynder fortællingen"}</h3><p>{filtered ? "Prøv et andet fornavn eller en anden aldersgruppe." : "Når den første besvarelse lander, kan du læse den her."}</p>{filtered && <button className={styles.outlineButton} onClick={reset}>Vis alle besvarelser</button>}</div> : <>
        <table className={styles.table}><caption className={styles.srOnly}>Besvarelser fra spørgeskemaet. Vælg Læs svar for at åbne en besvarelse.</caption><thead><tr><th scope="col" aria-sort={sort === "name" ? "ascending" : "none"}><button onClick={() => changeSort("name")}>Fornavn {sort === "name" && "↓"}</button></th><th scope="col" aria-sort={sort === "youngest" ? "ascending" : sort === "eldest" ? "descending" : "none"}><button onClick={() => changeSort(sort === "youngest" ? "eldest" : "youngest")}>Alder {sort === "youngest" ? "↑" : sort === "eldest" ? "↓" : "↕"}</button></th><th scope="col" aria-sort={sort === "participations" ? "descending" : "none"}><button onClick={() => changeSort("participations")}>Deltagelser {sort === "participations" && "↓"}</button></th><th scope="col" aria-sort={sort === "newest" ? "descending" : sort === "oldest" ? "ascending" : "none"}><button onClick={() => changeSort(sort === "newest" ? "oldest" : "newest")}>Modtaget {sort === "newest" ? "↓" : sort === "oldest" ? "↑" : "↕"}</button></th><th scope="col"><span className={styles.srOnly}>Åbn besvarelse</span></th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={row.id}><th scope="row"><button className={styles.nameButton} onClick={() => setSelected(index)}>{row.first_name}</button></th><td data-label="Alder">{row.age} år</td><td data-label="Deltagelser">{row.participations} gange</td><td data-label="Modtaget"><time dateTime={row.created_at}>{date(row.created_at)}</time></td><td><button className={styles.readButton} aria-label={`Læs svar fra ${row.first_name}, ${row.age} år`} onClick={() => setSelected(index)}>Læs svar <UiIcon name="arrow" /></button></td></tr>)}</tbody>
        </table>
        <nav className={styles.pagination} aria-label="Sider med besvarelser"><p>{page * ARCHIVE_PAGE_SIZE + 1}–{page * ARCHIVE_PAGE_SIZE + rows.length} af {matched}</p><div><button className={styles.outlineButton} disabled={page === 0} onClick={() => changePage(-1)}>← Forrige</button><span>Side {page + 1} af {Math.max(1, Math.ceil(matched / ARCHIVE_PAGE_SIZE))}</span><button className={styles.outlineButton} disabled={(page + 1) * ARCHIVE_PAGE_SIZE >= matched} onClick={() => changePage(1)}>Næste →</button></div></nav>
      </>}
    </section>

    <dialog className={styles.reader} ref={dialog} aria-labelledby="response-title" onClose={() => { if (!dialog.current?.open) setSelected(null); }} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      {current && <div className={styles.readerContent} ref={readerTop}>
        <div className={styles.readerBar}><span>Besvarelse {page * ARCHIVE_PAGE_SIZE + (selected ?? 0) + 1} af {matched}</span><button className={styles.closeButton} onClick={() => dialog.current?.close()} aria-label="Luk besvarelse"><UiIcon name="close" /></button></div>
        <header className={styles.person}><span className={styles.eyebrow}>ET MENNESKES KARNEVAL</span><h2 id="response-title" ref={readerTitle} tabIndex={-1}>{current.first_name}<span>{current.age} år</span></h2><dl><div><dt>Modtaget</dt><dd>{date(current.created_at)}</dd></div><div><dt>Postnummer</dt><dd>{current.postal_code}</dd></div><div><dt>Deltaget</dt><dd>Cirka {current.participations} gange</dd></div></dl></header>
        <article className={styles.answers}>{SURVEY_QUESTIONS.filter(question => question.id !== "words" || current.answers.words?.length).map((question, index) => <section key={question.id}><h3><span>{String(index + 1).padStart(2, "0")}</span>{question.title}</h3><div>{current.answers[question.id]?.length ? current.answers[question.id].map((answer, i) => <p key={i}>{question.kind === "sentences" ? "Aalborg Karneval er… " : ""}{answer}</p>) : <p className={styles.unanswered}>Ikke besvaret</p>}</div></section>)}</article>
        <footer className={styles.readerFooter}><p>{current.publication_permission ? "Må citeres med fornavn og alder." : "Må ikke citeres offentligt."}<br />{current.contact_permission ? "Har sagt ja til senere kontakt." : "Ønsker ikke senere kontakt."}</p><div><button className={styles.outlineButton} disabled={page === 0 && selected === 0} onClick={() => move(-1)}>← Forrige svar</button><button className={styles.readButton} disabled={page * ARCHIVE_PAGE_SIZE + (selected ?? 0) + 1 >= matched} onClick={() => move(1)}>Næste svar →</button></div><button className={styles.textButton} onClick={() => dialog.current?.close()}>Tilbage til overblikket</button></footer>
      </div>}
    </dialog>
  </div>;
}
