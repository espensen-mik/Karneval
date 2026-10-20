'use client';
import { useEffect, useRef, useState } from 'react';
import { fetchJson } from '@/lib/fetch-json';
import type { VoiceCollection, VoiceTarget, VoiceTheme } from '@/lib/digital-voices';
import UiIcon from './ui-icon';
import styles from './digital-voices.module.css';

async function save(values: object) {
  const response = await fetch('/api/sjaelen/stemmer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values), signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Kunne ikke gemme. Prøv igen.');
  return data;
}
export default function VoicePicker({ target, onClose, onSaved }: { target: VoiceTarget; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [themes, setThemes] = useState<VoiceTheme[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setLoadError('');
    const params = new URLSearchParams({ response: target.response_id, question: target.question_id, answer: String(target.answer_index) });
    fetchJson<VoiceCollection>(`/api/sjaelen/stemmer?${params}`, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setThemes(data.themes); setSelected(data.entries[0]?.theme_ids || []);
    }).catch(failure => { if (!controller.signal.aborted) setLoadError(failure.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [target.response_id, target.question_id, target.answer_index, reload]);
  async function createTheme() {
    if (!name.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const theme: VoiceTheme = await save({ action: 'theme', name });
      setThemes(current => [...current, theme].sort((a, b) => a.name.localeCompare(b.name, 'da')));
      setSelected(current => [...current, theme.id]); setName('');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Kunne ikke oprette tema.'); }
    finally { setBusy(false); }
  }
  async function submit() {
    setBusy(true); setError('');
    try { await save({ ...target, text: undefined, theme_ids: selected }); onSaved(); onClose(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Kunne ikke gemme.'); setBusy(false); }
  }
  return <dialog ref={dialog} className={styles.modal} aria-labelledby="voice-picker-title" onCancel={event => { if (busy) event.preventDefault(); }} onClose={onClose} onClick={event => event.stopPropagation()}>
    <div className={styles.modalBody}><header className={styles.modalHeader}><div><span className={styles.kicker}>UDVÆLG EN STEMME</span><h2 id="voice-picker-title">Tilføj til SJÆL</h2></div><button className={styles.iconButton} disabled={busy} aria-label="Luk temavælger" onClick={onClose}><UiIcon name="close" /></button></header>
      <blockquote className={styles.preview}>{target.text}</blockquote>
      <p>Vælg ét eller flere temaer. Svaret gemmes i Digitale stemmer med link til hele besvarelsen.</p>
      {loading ? <p role="status">Henter temaer …</p> : loadError ? <p role="alert">{loadError} <button className={styles.textButton} onClick={() => setReload(value => value + 1)}>Prøv igen</button></p> : <>
        <fieldset className={styles.choices} disabled={busy}><legend>Temaer · vælg flere</legend>{themes.length ? themes.map(theme => <label key={theme.id}><input type="checkbox" checked={selected.includes(theme.id)} onChange={event => setSelected(current => event.target.checked ? [...current, theme.id] : current.filter(id => id !== theme.id))} disabled={!selected.includes(theme.id) && selected.length >= 20} /><span>{theme.name}</span></label>) : <p>Der er endnu ingen temaer. Opret det første nedenfor.</p>}</fieldset>
        <form className={styles.createTheme} onSubmit={event => { event.preventDefault(); void createTheme(); }}><label htmlFor="voice-theme-name">Opret et nyt tema</label><div><input id="voice-theme-name" value={name} maxLength={80} disabled={busy} placeholder="Skriv et temanavn" onChange={event => setName(event.target.value)} /><button className={styles.outline} disabled={busy || !name.trim() || selected.length >= 20}>Opret & vælg</button></div></form>
        {selected.length === 0 && <p className={styles.note}>Ingen temaer valgt. Gemmer du sådan, fjernes svaret fra Digitale stemmer. Originalbesvarelsen bevares.</p>}
      </>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <footer className={styles.modalFooter}><button className={styles.outline} disabled={busy} onClick={onClose}>Annuller</button><button className={styles.primary} disabled={busy || loading || Boolean(loadError)} onClick={() => void submit()}>{busy ? 'Gemmer …' : 'Gem temaer'} <UiIcon name="arrow" /></button></footer>
    </div>
  </dialog>;
}
