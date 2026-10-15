"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { emptySurvey, SURVEY_QUESTIONS, type SurveyDraft } from "@/lib/survey";
import UiIcon from "./ui-icon";
import SurveySentenceAnswers from "./survey-sentence-answers";
const LAST_STEP = 11;

export default function SurveyApp() {
  const [draft, setDraft] = useState<SurveyDraft>(emptySurvey);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [website, setWebsite] = useState("");
  const responseId = useRef("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step, done]);
  const question = step >= 3 && step <= 9 ? SURVEY_QUESTIONS[step - 3] : null;
  const update = (key: keyof SurveyDraft, value: string | boolean) => setDraft(current => ({ ...current, [key]: value }));
  function setAnswers(id: (typeof SURVEY_QUESTIONS)[number]["id"], items: string[]) { setDraft(current => ({ ...current, answers: { ...current.answers, [id]: items } })); }
  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (step !== LAST_STEP) { setStep(current => current + 1); return; }
    if (!Object.values(draft.answers).some(items => items.some(item => item.trim()))) { setError("Skriv mindst ét svar med dine egne ord. Du kan gå tilbage og tilføje det."); return; }
    setBusy(true);
    if (!responseId.current) responseId.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/spoergeskema", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, id: responseId.current, website }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Svaret kunne ikke gemmes.");
      setDone(true); setDraft(emptySurvey());
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Svaret kunne ikke gemmes."); }
    finally { setBusy(false); }
  }
  return <div className="survey-page">
    <header className="survey-header"><a className="survey-brand" href="/spoergeskema"><span className="brand-mark">K</span>Sjælen af Karneval</a>{step > 0 && !done && <span aria-live="polite">{step} / {LAST_STEP}</span>}</header>
    {!done && <div className="survey-progress" role="progressbar" aria-label="Din fremdrift" aria-valuemin={0} aria-valuemax={LAST_STEP} aria-valuenow={step}><span style={{ width: `${step / LAST_STEP * 100}%` }} /></div>}
    {done ? <section className="survey-screen survey-thanks"><span className="eyebrow">DIN STEMME ER MED</span><h1 ref={heading} tabIndex={-1}>Tak for din del af sjælen<span>.</span></h1><p>Din besvarelse er gemt. Tak, fordi du deler dine ord, minder og oplevelser med Aalborg Karneval.</p><p className="survey-small">Du kan nu lukke siden.</p></section> : <form className={`survey-screen${question?.kind === "sentences" ? " survey-sentences" : ""}`} onSubmit={next} key={step}>
      <div className="survey-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label></div>
      {step === 0 && <><span className="eyebrow">DEN DIGITALE SJÆL</span><h1 ref={heading} tabIndex={-1}>Der er 1000 måder at elske Aalborg Karneval<span>.</span></h1><p>Alle har deres helt egne minder, historier og indre billeder. Men hvad har vi til fælles? Hvad er det, der definerer vores fælles karneval?</p><p>Vi arbejder på at finde helt ind i sjælen af Aalborg Karneval. Hvem er vi? Hvor kommer vi fra, og hvor skal vi hen? Hvordan ser karnevallet ud?</p><p>Hvis du elsker Aalborg Karneval, kan du være med til at præge fortællingen. Dine svar bliver blandt andet brugt, når vi skal designe en ny grafisk identitet og skrive vores kernefortælling, som skal leve i mange år fremad.</p><p>Du kan desuden vinde billetter til Kildeparken til Aalborg Karneval 2027 eller til Børnekarneval.</p><div className="survey-note">Ét spørgsmål ad gangen. Du kan gå tilbage undervejs og ændre dine svar. Dine svar sendes først, når du afslutter.</div></>}
      {step === 1 && <><span className="eyebrow">FØRST LIDT OM DIG</span><h1 ref={heading} tabIndex={-1}>Hvem er du<span>?</span></h1><p>Vi viser kun dit fornavn og din alder sammen med din besvarelse i researchrummet. Din mailadresse vises ikke der.</p><div className="survey-personal"><label className="form-field">Navn<input required autoComplete="name" value={draft.name} maxLength={160} onChange={event => update("name", event.target.value)} /></label><label className="form-field">Mailadresse<input required type="email" autoComplete="email" value={draft.email} maxLength={254} onChange={event => update("email", event.target.value)} /></label><label className="form-field">Alder<input required type="number" inputMode="numeric" min={0} max={120} step={1} value={draft.age} onChange={event => update("age", event.target.value)} /></label><label className="form-field">Postnummer<input required inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{4}" maxLength={4} value={draft.postal_code} onChange={event => update("postal_code", event.target.value)} /></label></div></>}
      {step === 2 && <><span className="eyebrow">DIT KARNEVAL</span><h1 ref={heading} tabIndex={-1}>Hvor mange gange har du cirka deltaget aktivt<span>?</span></h1><p>Tænk på både Børnekarneval, Gløden, Paraden og Kildeparken.</p><label className="form-field survey-count">Antal gange<input type="number" required inputMode="numeric" min={0} max={300} step={1} value={draft.participations} onChange={event => update("participations", event.target.value)} /></label><p className="survey-small">I de næste spørgsmål er vi ude efter dine egne ord, oplevelser og holdninger. De åbne spørgsmål er valgfrie — svar på dem, der siger dig noget.</p></>}
      {question && <>
        <span className="eyebrow">{question.kind === "sentences" ? "FULDFØR SÆTNINGEN" : "DINE EGNE ORD"}</span>
        <h1 ref={heading} tabIndex={-1}>{question.kind === "sentences" ? "Karneval er…" : question.title}</h1>
        <p>{question.kind === "sentences" ? "Skriv det første, der falder dig ind. Tilføj så en sætning mere — og en mere, hvis du har lyst." : question.help}</p>
        {question.kind === "text" ? <label className="form-field"><span className="survey-sr-only">Dit svar</span><textarea rows={6} maxLength={3000} placeholder="Skriv med dine egne ord …" value={draft.answers[question.id][0] || ""} onChange={event => setAnswers(question.id, [event.target.value])} /></label>
          : question.kind === "sentences" ? <SurveySentenceAnswers answers={draft.answers[question.id]} onChange={items => setAnswers(question.id, items)} />
          : <div className="survey-repeat-list">
            {(draft.answers.words.length ? draft.answers.words : [""]).map((answer, index) => <div className="survey-repeat-row" key={index}>
              <label className="form-field"><span>Ord eller vending {index + 1}</span><input maxLength={120} value={answer} placeholder="Et ord eller en kort vending" id={`repeat-${index}`}
                onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); if (answer.trim() && draft.answers.words.length < 100) { setAnswers("words", [...draft.answers.words, ""]); requestAnimationFrame(() => document.getElementById(`repeat-${index + 1}`)?.focus()); } } }}
                onChange={event => { const items = [...(draft.answers.words.length ? draft.answers.words : [""])]; items[index] = event.target.value; setAnswers("words", items); }} /></label>
              {index > 0 && <button className="survey-remove" type="button" aria-label={`Fjern svar ${index + 1}`} onClick={() => setAnswers("words", draft.answers.words.filter((_, i) => i !== index))}><UiIcon name="close" /></button>}
            </div>)}
            <button className="survey-add" type="button" disabled={draft.answers.words.length >= 100 || !(draft.answers.words.at(-1) || "").trim()} onClick={() => setAnswers("words", [...draft.answers.words, ""])}>+ Tilføj et ord eller en vending</button>
          </div>}
        <p className="survey-small">Valgfrit · Du kan gå videre uden at besvare dette spørgsmål.</p>
      </>}
      {step === 10 && <><span className="eyebrow">MÅ VI HØRE MERE?</span><h1 ref={heading} tabIndex={-1}>Må vi kontakte dig senere<span>?</span></h1><p>Hvis vi gerne vil høre mere uddybende om dine oplevelser.</p><fieldset className="survey-choice"><legend className="survey-sr-only">Tilladelse til senere kontakt</legend>{[["yes", "Ja, I må gerne kontakte mig"], ["no", "Nej tak"]].map(([value, label]) => <label key={value}><input type="radio" name="contact" required value={value} checked={draft.contact_permission === value} onChange={() => update("contact_permission", value)} /><span>{label}</span></label>)}</fieldset></>}
      {step === LAST_STEP && <><span className="eyebrow">ET SIDSTE KIG</span><h1 ref={heading} tabIndex={-1}>Din del af fortællingen<span>.</span></h1><p>Se dine svar igennem, før du sender dem.</p><div className="survey-review"><section><h2>Dine oplysninger</h2><p>{draft.name} · {draft.age} år · {draft.postal_code}</p><p>{draft.email}</p><p>Deltaget cirka {draft.participations} gange</p><button type="button" onClick={() => setStep(1)}>Ret oplysninger</button></section>{SURVEY_QUESTIONS.map((q, index) => <section key={q.id}><h2>{q.title}</h2>{draft.answers[q.id].filter(a => a.trim()).length ? draft.answers[q.id].filter(a => a.trim()).map((answer, i) => <p key={i}>{q.kind === "sentences" ? "Karneval er… " : ""}{answer}</p>) : <p className="survey-small">Ikke besvaret</p>}<button type="button" onClick={() => setStep(index + 3)}>Ret svar</button></section>)}<section><h2>Senere kontakt</h2><p>{draft.contact_permission === "yes" ? "Ja, I må kontakte mig." : "Nej tak."}</p><button type="button" onClick={() => setStep(10)}>Ret valg</button></section></div><label className="survey-permission"><input type="checkbox" required checked={draft.publication_permission} onChange={event => update("publication_permission", event.target.checked)} /><span>Jeg accepterer, at Aalborg Karneval må bruge mine ord som citater i profilering af Aalborg Karneval med mit fornavn og min alder. Mine svar må indgå i arbejdet med grafisk identitet og kernefortælling.</span></label></>}
      {error && <p className="form-message error" role="alert">{error}</p>}
      <footer className="survey-actions">{step > 0 && <button className="quote-action-cancel" type="button" disabled={busy} onClick={() => { setError(""); setStep(current => current - 1); }}>Tilbage</button>}<button className="submit-quote" disabled={busy} type="submit">{busy ? "Sender …" : step === 0 ? "Del dit karneval" : step === LAST_STEP ? "Send min besvarelse" : "Næste"}<UiIcon name="arrow" /></button></footer>
    </form>}
    <footer className="survey-footer">AALBORG KARNEVAL · DEN DIGITALE SJÆL</footer>
  </div>;
}
