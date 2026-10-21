'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { SurveyAnalysis } from '@/lib/survey-analysis';
import UiIcon from './ui-icon';
import styles from './survey-analysis-app.module.css';
const number = (value: number | null) => value === null ? '—' : new Intl.NumberFormat('da-DK', { maximumFractionDigits: 1 }).format(value);
const percent = (count: number, total: number) => `${number(total ? count / total * 100 : 0)} %`;
function Highlight({ text, term }: { text: string; term: string }) {
  const pattern = new RegExp(`(?<!\\p{L})(${term.split(" ").join("[ \\t]+")})(?!\\p{L})`, "giu");
  return text.normalize("NFC").split(pattern).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : part);
}
function Distribution({ title, intro, rows, total, children, className = "" }: { title: string; intro: string; rows: { label: string; count: number; postalCodes?: string[] }[]; total: number; children?: ReactNode; className?: string }) {
  return <section className={`${styles.card} ${className}`}><h2>{title}</h2><p>{intro}</p>{total ? <ul className={styles.distribution} tabIndex={className ? 0 : undefined} aria-label={title}>{rows.map(row => <li key={row.label}><span>{row.label}{row.postalCodes && <small>{row.postalCodes.join(", ")}</small>}</span><div className={styles.track} role="meter" aria-label={row.label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={row.count} aria-valuetext={`${row.count} besvarelser, ${percent(row.count, total)}`}><i style={{ width: `${row.count / total * 100}%` }} /></div><strong>{row.count}<small>{percent(row.count, total)}</small></strong></li>)}</ul> : <div className={styles.empty}>Fordelingen vises, når der er besvarelser.</div>}<span className={styles.chartNote}>{total} besvarelser · Andel af alle besvarelser</span>{children}</section>;
}
export default function SurveyAnalysisApp() {
  const examples = useRef<HTMLElement>(null);
  const [allPlaces, setAllPlaces] = useState(false);
  const [data, setData] = useState<SurveyAnalysis | null>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [unit, setUnit] = useState('people');
  const [kind, setKind] = useState('word');
  const [minimum, setMinimum] = useState('1');
  const [limit, setLimit] = useState('20');
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => { const timer = setTimeout(() => setSearch(query), 250); return () => clearTimeout(timer); }, [query]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    const params = new URLSearchParams({ q: search, unit, kind, minimum, limit });
    fetch(`/api/den-digitale-sjael/analyse?${params}`, { cache: 'no-store', signal: controller.signal }).then(async response => {
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Analysen kunne ikke hentes.');
      if (controller.signal.aborted) return;
      setData(result); setSelected(current => result.terms.some((term: { label: string }) => term.label === current) ? current : result.terms[0]?.label || '');
    }).catch(failure => { if (failure.name !== 'AbortError') setError(failure.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [search, unit, kind, minimum, limit, reload]);
  const term = data?.terms.find(item => item.label === selected);
  const pending = loading || search !== query;
  const denominator = data?.unit === 'answers' ? data.statements : data?.answeredPeople || 0;
  return <div className={styles.page}>
    <header className={styles.header}><div><span className={styles.eyebrow}>DEN DIGITALE SJÆL · ANALYSE</span><h1>Mønstre i stemmerne<span>.</span></h1><p>Hvem har svaret — og hvilke ord går igen?</p></div><Link className={styles.outline} href="/den-digitale-sjael">Se besvarelser <UiIcon name="arrow" /></Link></header>
    <div className={styles.summary}><dl><div><dt>Besvarelser</dt><dd>{data && !error ? number(data.total) : '—'}</dd></div><div><dt>Gennemsnitsalder</dt><dd>{data && !error ? number(data.averageAge) : '—'}<small> år</small></dd></div><div><dt>Deltaget i gennemsnit</dt><dd>{data && !error ? number(data.averageParticipations) : '—'}<small> gange</small></dd></div></dl><button disabled={loading} onClick={() => setReload(value => value + 1)}><UiIcon name="refresh" /> Opdatér</button></div>
    {error ? <div className={styles.empty} role="alert"><h2>Vi kunne ikke hente analysen</h2><p>{error}</p><button className={styles.outline} onClick={() => setReload(value => value + 1)}>Prøv igen</button></div> : !data ? <div className={styles.empty} role="status">Henter besvarelser og beregner analysen …</div> : <>
      <div className={styles.charts}><Distribution title="Aldersfordeling" intro="Respondenternes alder fordelt på aldersgrupper." rows={data.ages} total={data.total} /><Distribution title="Hvor mange gange har de været med?" intro="Antal deltagelser — både som aktiv deltager og tilskuer." rows={data.participations} total={data.total} /></div>
      <Distribution className={styles.geography} title="Hvor kommer deltagerne fra?" intro="Fordelingen følger det oplyste postnummer og viser postbyens navn. Hver besvarelse tæller én gang." rows={allPlaces ? data.places : data.places.slice(0, 10)} total={data.total}>
        {data.places.length > 10 && <button className={styles.outline} aria-expanded={allPlaces} onClick={() => setAllPlaces(value => !value)}>{allPlaces ? 'Vis de 10 største områder' : `Vis alle ${data.places.length} områder`}</button>}
        <p className={styles.chartNote}>Et postnummerområde kan omfatte flere byer. Fx vises Aalborg, Aalborg SV og Nørresundby hver for sig. Ukendte postnumre beholdes i fordelingen. Postbynavne: <a href="https://www.statistikbanken.dk/POSTNR2" target="_blank" rel="noopener noreferrer">Danmarks Statistik · POSTNR2</a>.</p>
      </Distribution>
      <section className={styles.words} aria-labelledby="survey-words-title"><header><span className={styles.eyebrow}>ORDENE I BESVARELSERNE</span><h2 id="survey-words-title">Aalborg Karneval er…</h2><p>{data.statements} enkelte svar fra {data.answeredPeople} besvarelser. Udforsk de ord og vendinger, de faktisk har skrevet.</p></header>
        <div className={styles.filters}><label>Søg i ord og vendinger<input type="search" placeholder="Hvilket ord leder du efter?" value={query} maxLength={100} onChange={event => setQuery(event.target.value)} /></label><label>Vis<select value={kind} onChange={event => setKind(event.target.value)}><option value="word">Enkeltord</option><option value="phrase">Gentagne vendinger</option></select></label><label>Tæl<select value={unit} onChange={event => setUnit(event.target.value)}><option value="people">Forskellige besvarelser</option><option value="answers">Enkelte svar</option></select></label><label>Mindst<select value={minimum} onChange={event => setMinimum(event.target.value)}>{[1, 2, 3, 5].map(value => <option key={value} value={value}>{value}</option>)}</select></label></div>
        <p className={styles.resultNote} role="status">{pending ? 'Opdaterer ordanalysen …' : `${data.terms.length} af ${data.availableTerms} ${data.kind === 'word' ? 'ord' : 'vendinger'} · Tæller ${data.unit === 'people' ? 'besvarelser' : 'svar'}`}</p>
        {pending ? <div className={styles.empty}>Beregner …</div> : !data.terms.length ? <div className={styles.empty}><h3>{data.statements ? 'Ingen ord matcher denne visning' : 'De første ord venter'}</h3><p>{data.statements ? 'Prøv en anden søgning eller en lavere minimumsgrænse. Vendinger skal forekomme hos mindst to forskellige besvarelser.' : 'Når nogen svarer på “Aalborg Karneval er…”, vises deres ord her.'}</p></div> : <div className={styles.wordExplorer}><div className={styles.termList} aria-label="Hyppigste ord og vendinger">{data.terms.map(item => <button className={`${styles.term} ${selected === item.label ? styles.selected : ''}`} key={item.label} aria-pressed={selected === item.label} onClick={() => { setSelected(item.label); if (window.matchMedia("(max-width: 850px)").matches) requestAnimationFrame(() => examples.current?.scrollIntoView({ block: "start", behavior: "instant" })); }}><span className={styles.termFill} style={{ width: `${item[data.unit] / Math.max(1, denominator) * 100}%` }} /><span className={styles.termLabel}>{item.label}</span><strong>{item[data.unit]}<small>{percent(item[data.unit], denominator)}</small></strong></button>)}{data.terms.length < data.availableTerms && data.limit < 80 && <button className={styles.outline} onClick={() => setLimit(data.limit === 20 ? '40' : '80')}>Vis flere</button>}</div>
          {term && <aside ref={examples} className={styles.examples} aria-label={`Eksempler med ${term.label}`}><span className={styles.eyebrow}>TILBAGE TIL ORDENE</span><h3>{term.label}</h3><p><strong>{term.people} besvarelser</strong> · {term.answers} enkelte svar</p><p>{percent(term[data.unit], denominator)} af de {data.unit === 'people' ? 'besvarelser, der indeholder svar på spørgsmålet' : 'enkelte svar på spørgsmålet'}.</p><h4>Fra besvarelserne</h4><ol>{term.examples.map((text, index) => <li key={index}><Highlight text={text} term={term.label} /></li>)}</ol><span className={styles.chartNote}>Op til fem forskellige teksteksempler. Afsenderoplysninger indgår ikke i ordoptællingen.</span></aside>}
        </div>}
        <details className={styles.method}><summary>Sådan beregnes analysen</summary><p>Kun svarene på “Aalborg Karneval er…” analyseres. Hvert udfyldt felt er ét svar. Store og små bogstaver samles, tegnsætning normaliseres, og almindelige danske fyldord fjernes med samme stopordsliste som i ordnetværket.</p><p>Som standard tæller et ord højst én gang pr. besvarelse, også når personen har skrevet flere svar. Vælger du “Enkelte svar”, tæller ordet højst én gang pr. svar. Procenten følger den valgte optælling. Sætningens faste åbning fjernes, hvis den er skrevet med i begyndelsen af et svar.</p><p>Vendinger består af 2–4 sammenhængende ord og skal være skrevet af mindst to forskellige besvarelser. Bøjningsformer og synonymer samles ikke automatisk. Analysen er regelbaseret og sender ikke indhold til AI-tjenester. Citater, kilder og det eksisterende ordnetværk indgår ikke i denne analyse.</p></details>
      </section>
    </>}
  </div>;
}
