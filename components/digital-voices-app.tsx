'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJson } from '@/lib/fetch-json';
import { VOICE_PAGE_SIZE, voiceContextHref, type VoiceCollection, type VoiceTarget } from '@/lib/digital-voices';
import { SURVEY_QUESTIONS } from '@/lib/survey';
import VoicePicker from './voice-picker';
import UiIcon from './ui-icon';
import styles from './digital-voices.module.css';
export default function DigitalVoicesApp() {
  const [data, setData] = useState<VoiceCollection | null>(null);
  const [theme, setTheme] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<VoiceTarget | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(0); }, 250); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    const params = new URLSearchParams({ theme, q: query, page: String(page) });
    fetchJson<VoiceCollection>(`/api/sjaelen/stemmer?${params}`, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      if (!result.entries.length && page > 0 && result.matched <= page * VOICE_PAGE_SIZE) { setPage(Math.max(0, Math.ceil(result.matched / VOICE_PAGE_SIZE) - 1)); return; }
      setData(result);
    }).catch(failure => { if (!controller.signal.aborted) setError(failure.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [theme, query, page, reload]);
  const pending = loading || search !== query;
  return <div className={styles.page}>
    <header className={styles.header}><div><span className={styles.kicker}>UDVALGT AF OS · SAGT AF DELTAGERNE</span><h1>Digitale stemmer<span>.</span></h1><p>Oplevelser, tanker og fortællinger — samlet i jeres egne temaer.</p></div><Link className={styles.outline} href="/den-digitale-sjael">Find flere stemmer <UiIcon name="arrow" /></Link></header>
    <nav className={styles.exploreNav} aria-label="Udforsk SJÆLEN"><Link href="/sjaelen/ordnetvaerk">Ordnetværk</Link><Link href="/sjaelen/leg-med-ord">Leg med ord</Link><span aria-current="page">Digitale stemmer</span></nav>
    <div className={styles.controls}><div className={styles.themeList} role="group" aria-label="Filtrér stemmer efter tema"><button aria-pressed={!theme} onClick={() => { setTheme(''); setPage(0); }}>Alle stemmer <span>{data?.total ?? '—'}</span></button>{data?.themes.map(item => <button key={item.id} aria-pressed={theme === item.id} onClick={() => { setTheme(item.id); setPage(0); }}>{item.name} <span>{item.count}</span></button>)}</div><label className={styles.search}>Søg i de udvalgte svar<input type="search" value={search} maxLength={100} placeholder="Hvilken historie leder du efter?" onChange={event => setSearch(event.target.value)} /></label></div>
    <div className={styles.resultBar}><p role="status">{pending ? 'Henter stemmer …' : error ? 'Stemmerne kunne ikke hentes' : `${data?.matched ?? 0} ${data?.matched === 1 ? "udvalgt svar" : "udvalgte svar"}${theme ? ` · ${data?.themes.find(item => item.id === theme)?.name || ''}` : ''}`}</p><button className={styles.textButton} disabled={pending} onClick={() => setReload(value => value + 1)}>Opdatér <UiIcon name="refresh" /></button></div>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {error ? <div className={styles.empty} role="alert"><h2>Vi kunne ikke hente stemmerne</h2><p>{error}</p><button className={styles.outline} onClick={() => setReload(value => value + 1)}>Prøv igen</button></div> : pending ? <div className={styles.empty}>Vi finder fortællingerne …</div> : !data?.entries.length ? <div className={styles.empty}><span className={styles.kicker}>{data?.total ? 'PRØV ET ANDET UDSNIT' : 'HER BEGYNDER SAMLINGEN'}</span><h2>{data?.total ? 'Ingen stemmer matcher' : 'De historier, I vil holde fast i.'}</h2><p>{data?.total ? 'Vælg et andet tema eller en anden søgning.' : 'Åbn en besvarelse i Den digitale sjæl, og vælg “Tilføj til SJÆL” ved et svar. Giv det et eller flere temaer — så lander det her.'}</p><Link className={styles.outline} href="/den-digitale-sjael">Gå til besvarelser <UiIcon name="arrow" /></Link></div> : <>
      <div className={styles.grid}>{data.entries.map(voice => <article key={voice.id} className={styles.card}><div className={styles.cardThemes}>{voice.theme_ids.map(id => <button key={id} onClick={() => { setTheme(id); setPage(0); }}>{data.themes.find(item => item.id === id)?.name || 'Tema'}</button>)}</div><p className={styles.question}>{SURVEY_QUESTIONS.find(item => item.id === voice.question_id)?.title}</p><blockquote>{voice.question_id === 'carnival_is' && !/^\s*(aalborg\s+)?karneval\s+er\b/i.test(voice.text) ? 'Aalborg Karneval er… ' : ''}{voice.text}</blockquote><div className={styles.person}>{voice.first_name}<span>{voice.age} år</span></div><footer><Link className={styles.textButton} href={voiceContextHref(voice.response_id)}>Hele besvarelsen <UiIcon name="arrow" /></Link><button className={styles.textButton} onClick={() => setTarget({ response_id: voice.response_id, question_id: voice.question_id, answer_index: voice.answer_index, text: voice.text })}>Redigér temaer</button></footer></article>)}</div>
      <nav className={styles.pagination} aria-label="Sider med digitale stemmer"><button className={styles.outline} disabled={page === 0} onClick={() => setPage(value => value - 1)}>← Forrige</button><span>Side {page + 1} af {Math.max(1, Math.ceil(data.matched / VOICE_PAGE_SIZE))}</span><button className={styles.outline} disabled={(page + 1) * VOICE_PAGE_SIZE >= data.matched} onClick={() => setPage(value => value + 1)}>Næste →</button></nav>
    </>}
    <p className={styles.note}>Temaerne er jeres redaktionelle fortolkning. Originalbesvarelserne ændres ikke. Et svar kan høre til flere temaer og vises kun én gang i “Alle stemmer”.</p>
    {target && <VoicePicker key={`${target.response_id}:${target.question_id}:${target.answer_index}`} target={target} onClose={() => setTarget(null)} onSaved={() => { setNotice('Temaerne er gemt.'); setReload(value => value + 1); }} />}
  </div>;
}
