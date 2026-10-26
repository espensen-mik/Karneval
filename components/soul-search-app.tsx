'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import UiIcon from './ui-icon';
import { randomDiscoveryWords, SEARCH_SOURCES, type SearchDocument } from '@/lib/soul-search';
import s from './soul-search.module.css';

type Result = Omit<SearchDocument, 'text' | 'wordText'> & { excerpt: string };
type SearchData = { results: Result[]; total: number; page: number; pages: number; documents: number; words: { word: string; count: number; texts: number }[] };
function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query.trim().split(/\s+/u).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!terms.length) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'giu');
  return <>{text.split(pattern).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : part)}</>;
}

export default function SoulSearchApp() {
  const params = useSearchParams();
  const router = useRouter();
  const query = (params.get('q') || '').trim().slice(0, 200);
  const source = params.get('source') || '';
  const page = Math.max(0, Number(params.get('page')) || 0);
  const [input, setInput] = useState(query);
  const [data, setData] = useState<SearchData | null>(null);
  const [suggestions, setSuggestions] = useState<SearchData['words']>([]);
  const [wordRefresh, setWordRefresh] = useState(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const hero = useRef<HTMLElement>(null);
  const scrollTarget = useRef<'hero' | 'results' | null>(null);
  useEffect(() => {
    if (!data || !scrollTarget.current) return;
    const target = scrollTarget.current === 'results' ? resultsHeading.current : hero.current;
    target?.scrollIntoView({ behavior: 'instant', block: 'start' });
    scrollTarget.current = null;
  }, [data]);
  useEffect(() => setInput(query), [query]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    const search = new URLSearchParams({ q: query, source, page: String(page) });
    fetch(`/api/sjaelen/soeg?${search}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Søgningen kunne ikke gennemføres.');
      if (!controller.signal.aborted) { setData(value); setSuggestions(randomDiscoveryWords(value.words)); }
    }).catch(failure => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, source, page, retry]);
  function navigate(value: string, kind = source, nextPage = 0) {
    scrollTarget.current = nextPage ? 'results' : 'hero';
    const search = new URLSearchParams();
    if (value.trim()) search.set('q', value.trim());
    if (kind) search.set('source', kind);
    if (nextPage) search.set('page', String(nextPage));
    router.push(`/sjaelen/soeg${search.size ? `?${search}` : ''}`, { scroll: false });
  }
  return <div className={`${s.page}${query ? ` ${s.searching}` : ''}`}>
    <header className={s.hero} ref={hero}>
      <p className={s.eyebrow}>ORD · OPLEVELSER · MENNESKER</p>
      <h1>Søg i sjælen<span>.</span></h1>
      <form className={s.searchForm} role="search" onSubmit={event => { event.preventDefault(); navigate(input, '', 0); }}>
        <label htmlFor="soul-search" className={s.srOnly}>Søg i sjælen</label>
        <UiIcon name="search" />
        <input id="soul-search" type="search" placeholder="Søg i sjælen" value={input} onChange={event => setInput(event.target.value)} maxLength={200} autoComplete="off" />
        <button type="submit" aria-label="Søg"><UiIcon name="arrow" /></button>
      </form>
      <p className={s.intro}>Find ordene. Følg historierne. Opdag det, der binder os sammen.</p>
    </header>
    {!query && <section className={s.words} aria-labelledby="frequent-heading"><div className={s.wordsHeading}><h2 id="frequent-heading">Ord at gå på opdagelse i</h2><button className={s.refreshWords} type="button" disabled={loading || !data?.words.length} aria-label="Vis nye tilfældige ord" title="Vis nye tilfældige ord" onClick={() => { if (data) setSuggestions(previous => randomDiscoveryWords(data.words, previous.map(word => word.word))); setWordRefresh(value => value + 1); }}><UiIcon key={wordRefresh} name="refresh" className={wordRefresh ? s.refreshing : ''} /></button></div>
      {data && <><div className={s.wordList} aria-live="polite" aria-atomic="true">{suggestions.map(word => <button key={word.word} onClick={() => navigate(word.word, '')} title={`${word.count} forekomster i ${word.texts} tekster`}>{word.word}<span>{word.count.toLocaleString('da-DK')}</span></button>)}</div><p className={s.caption}>Et tilfældigt udvalg af op til 20 ord med mere end 20 forekomster i citater, spørgeskemasvar og Sjælemøde. Fyldeord og den faste sætningsstart er sorteret fra. Ordformer tælles hver for sig.</p>{!suggestions.length && <p>Der er endnu ingen ord med mere end 20 forekomster.</p>}</>}
    </section>}
    {query && <section className={s.results} aria-labelledby="search-results">
      <nav className={s.filters} aria-label="Materialetype">{[['', 'Alt materiale'], ...Object.entries(SEARCH_SOURCES)].map(([key, label]) => <button key={key} aria-pressed={source === key} onClick={() => navigate(query, key)}>{label}</button>)}</nav>
      <h2 id="search-results" ref={resultsHeading} className={s.resultCount}>{data ? `${data.total.toLocaleString('da-DK')} ${data.total === 1 ? 'resultat' : 'resultater'} for »${query}«` : error ? 'Søgningen kunne ikke gennemføres' : 'Søger i materialet …'}</h2>
      {data?.results.map(result => <article key={result.id} className={s.result}>
        <p className={s.origin}>{SEARCH_SOURCES[result.source]}<span> / </span><Highlight text={result.context} query={query} /></p>
        <h3><Link href={result.href}><Highlight text={result.title} query={query} /><UiIcon name="arrow" /></Link></h3>
        <p className={s.excerpt}><Highlight text={result.excerpt} query={query} /></p>
      </article>)}
      {data && !data.results.length && <div className={s.empty}><h3>Ingen spor endnu.</h3><p>Prøv et andet ord, en kortere formulering eller søg i alt materialet. Flere søgeord skal alle findes i samme resultat.</p>{source && <button onClick={() => navigate(query, '')}>Søg i alt materiale <UiIcon name="arrow" /></button>}</div>}
      {data && data.pages > 1 && <nav className={s.pagination} aria-label="Søgeresultatsider"><button disabled={!data.page} onClick={() => navigate(query, source, data.page - 1)}>← Forrige</button><span>Side {data.page + 1} af {data.pages}</span><button disabled={data.page + 1 >= data.pages} onClick={() => navigate(query, source, data.page + 1)}>Næste →</button></nav>}
    </section>}
    {loading && <p className={s.status} role="status">{query ? 'Finder historier og ord …' : 'Samler ordene fra materialet …'}</p>}
    {error && <div className={s.empty} role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Prøv igen <UiIcon name="refresh" /></button></div>}
    <footer className={s.footer}><p>Citater · Den digitale sjæl · Sjælemøde · Kilderegister</p><p>I kilderegisteret søges kun i titel, forfatter og filnavn — ikke inde i PDF’er eller eksterne artikler.</p><Link href="/sjaelen/ordnetvaerk">Tag på Sjælerejse <UiIcon name="arrow" /></Link></footer>
  </div>;
}
