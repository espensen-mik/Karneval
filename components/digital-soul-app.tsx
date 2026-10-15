"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SURVEY_QUESTIONS, type SurveyResponse } from "@/lib/survey";
import UiIcon from "./ui-icon";
export default function DigitalSoulApp() {
  const [rows, setRows] = useState<SurveyResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const openLast = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    fetch(`/api/den-digitale-sjael?page=${page}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Besvarelserne kunne ikke læses.");
      setRows(data.rows); setTotal(data.total); setSelected(openLast.current ? Math.max(0, data.rows.length - 1) : 0); openLast.current = false;
    }).catch(failure => { if (failure.name !== "AbortError") setError(failure.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, reload]);
  const current = rows[selected];
  function move(direction: number) {
    if (direction === -1 && selected === 0) { openLast.current = true; setPage(page - 1); return; }
    if (direction === 1 && selected === rows.length - 1) { setPage(page + 1); return; }
    setSelected(selected + direction);
  }
  return <div className="digital-soul-page page-wrap"><header className="digital-soul-header"><div><span className="eyebrow">STEMMER FRA SPØRGESKEMAET</span><h1>Den digitale sjæl<span>.</span></h1><p>Én besvarelse. Ét menneskes karneval.</p></div><Link className="digital-survey-link" href="/spoergeskema" target="_blank" rel="noopener noreferrer">Åbn spørgeskemaet <UiIcon name="arrow" /></Link></header>
    <div className="digital-soul-status"><span aria-live="polite">{loading ? "Henter besvarelser …" : error ? "Forbindelsen kunne ikke åbnes" : `${total} ${total === 1 ? "besvarelse" : "besvarelser"}`}</span><button disabled={loading} onClick={() => setReload(value => value + 1)}>Opdatér <UiIcon name="refresh" /></button></div>
    {loading ? <div className="digital-empty" role="status">Vi finder stemmerne …</div> : error ? <div className="digital-empty" role="alert"><h2>Vi kunne ikke hente besvarelserne</h2><p>{error}</p><button className="quote-action-cancel" onClick={() => setReload(value => value + 1)}>Prøv igen</button></div> : !total ? <div className="digital-empty"><UiIcon name="digital" /><h2>Den første stemme venter.</h2><p>Når nogen indsender spørgeskemaet, kan du læse deres besvarelse her med fornavn og alder.</p><Link className="submit-quote" href="/spoergeskema" target="_blank" rel="noopener noreferrer">Se spørgeskemaet <UiIcon name="arrow" /></Link><p className="survey-small">Besvarelserne indgår ikke i SJÆLENs ordanalyse eller Leg med ord.</p></div> : current ? <div className="digital-reader"><aside className="digital-people" aria-label="Vælg en besvarelse">{rows.map((row, index) => <button key={row.id} className={index === selected ? "selected" : ""} aria-pressed={index === selected} onClick={() => setSelected(index)}><strong>{row.first_name}</strong><span>{row.age} år</span><small>{new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", timeZone: "Europe/Copenhagen" }).format(new Date(row.created_at))}</small></button>)}<div className="digital-pagination"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Forrige 50</button><button disabled={(page + 1) * 50 >= total} onClick={() => setPage(page + 1)}>Næste 50</button></div></aside><article className="digital-response" aria-label={`Besvarelse fra ${current.first_name}, ${current.age} år`}><nav className="digital-reader-nav" aria-label="Bladr mellem besvarelser"><button disabled={page === 0 && selected === 0} onClick={() => move(-1)}>← Forrige</button><span>{page * 50 + selected + 1} / {total}</span><button disabled={page * 50 + selected + 1 >= total} onClick={() => move(1)}>Næste →</button></nav><header><span className="eyebrow">ET MENNESKES KARNEVAL</span><h2>{current.first_name}<span>, {current.age} år</span></h2><p>Postnummer {current.postal_code} · Deltaget cirka {current.participations} gange</p><time dateTime={current.created_at}>{new Intl.DateTimeFormat("da-DK", { dateStyle: "long", timeZone: "Europe/Copenhagen" }).format(new Date(current.created_at))}</time></header>{SURVEY_QUESTIONS.map(question => <section className="digital-answer" key={question.id}><h3>{question.title}</h3>{current.answers[question.id]?.length ? current.answers[question.id].map((answer, index) => <p key={index}>{question.kind === "sentences" ? "Karneval er… " : ""}{answer}</p>) : <p className="digital-unanswered">Ikke besvaret</p>}</section>)}<footer className="digital-permissions"><p>{current.publication_permission ? "Tilladelse til brug af citater med fornavn og alder." : "Ingen tilladelse til offentlig citering."}</p><p>{current.contact_permission ? "Har sagt ja til senere kontakt." : "Ønsker ikke senere kontakt."}</p></footer></article></div> : <div className="digital-empty"><p>Der er ikke flere besvarelser på denne side.</p><button className="quote-action-cancel" onClick={() => setPage(Math.max(0, page - 1))}>Tilbage</button></div>}
  </div>;
}
