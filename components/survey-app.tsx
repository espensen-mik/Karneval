"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { emptySurvey, ACTIVE_SURVEY_QUESTIONS as SURVEY_QUESTIONS, type SurveyDraft } from "@/lib/survey";
import UiIcon from "./ui-icon";
import SurveySentenceAnswers from "./survey-sentence-answers";
import SurveyPrize from "./survey-prize";
const CONTACT_STEP = 3 + SURVEY_QUESTIONS.length;
const LAST_STEP = CONTACT_STEP + 1;

export default function SurveyApp({ testMode = false }: { testMode?: boolean }) {
  const [draft, setDraft] = useState<SurveyDraft>(emptySurvey);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [website, setWebsite] = useState("");
  const [traditionsChoice, setTraditionsChoice] = useState<"" | "yes" | "no">("");
  const [traditionsText, setTraditionsText] = useState("");
  const responseId = useRef("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); }, [step, done]);
  const question = step >= 3 && step < CONTACT_STEP ? SURVEY_QUESTIONS[step - 3] : null;
  const update = (key: keyof SurveyDraft, value: string | boolean) => setDraft(current => ({ ...current, [key]: value }));
  function setAnswers(id: (typeof SURVEY_QUESTIONS)[number]["id"], items: string[]) { setDraft(current => ({ ...current, answers: { ...current.answers, [id]: items } })); }
  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (testMode) {
      if (step === LAST_STEP) setDone(true);
      else setStep(current => current + 1);
      return;
    }
    if (question && !draft.answers[question.id].some(answer => answer.trim())) { setError("Skriv et svar, før du går videre."); return; }
    if (step !== LAST_STEP) { setStep(current => current + 1); return; }
    if (SURVEY_QUESTIONS.some(q => !draft.answers[q.id].some(item => item.trim()))) { setError("Besvar alle spørgsmål, før du sender. Du kan gå tilbage og tilføje dine svar."); return; }
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
  return <div className={`survey-page${done ? " is-complete" : ""}`}>
    <header className="survey-header"><a className="survey-brand" href={testMode ? "/spoergeskema?test=1" : "/spoergeskema"}>Sjælen af Karneval</a>{!done && (step > 0 || testMode) && <span aria-live="polite">{testMode ? "Layouttest · " : ""}{step} / {LAST_STEP}</span>}</header>
    {!done && <div className="survey-progress" role="progressbar" aria-label="Din fremdrift" aria-valuemin={0} aria-valuemax={LAST_STEP} aria-valuenow={step}><span style={{ width: `${step / LAST_STEP * 100}%` }} /></div>}
    {done ? <section className="survey-screen survey-thanks"><span className="eyebrow">DIN STEMME ER MED</span><h1 ref={heading} tabIndex={-1}>Tak for din del af sjælen<span>.</span></h1><p>{testMode ? "Dette er en layouttest. Ingen besvarelse er sendt eller gemt." : "Din besvarelse er gemt. Tak, fordi du deler dine ord, minder og oplevelser med Aalborg Karneval."}</p><p className="survey-small">Du kan nu lukke siden.</p>{testMode && <button className="quote-action-cancel" type="button" onClick={() => setDone(false)}>Tilbage til sidste side</button>}</section> : <form className={`survey-screen${question?.kind === "sentences" ? " survey-sentences" : ""}`} onSubmit={next} noValidate={testMode} key={step}>
      <div className="survey-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label></div>
      {step === 0 && <><SurveyPrize /><h1 ref={heading} tabIndex={-1}>Der er 1000 måder at elske Aalborg Karneval<span>.</span></h1><p><strong>Alle har deres helt egne minder, historier og indre billeder. Men hvad har vi til fælles? Hvad er det, der definerer vores fælles karneval?</strong></p><p>Vi arbejder på at finde helt ind i sjælen af Aalborg Karneval. Hvem er vi? Hvor kommer vi fra, og hvor skal vi hen? Hvordan ser karnevallet ud?</p><p>Hvis du elsker Aalborg Karneval, kan du være med til at præge fortællingen. Dine svar bliver blandt andet brugt, når vi skal designe en ny grafisk identitet og skrive vores kernefortælling, som skal leve i mange år fremad.</p></>}
      {step === 1 && <><span className="eyebrow">FØRST LIDT OM DIG</span><h1 ref={heading} tabIndex={-1}>Hvem er du<span>?</span></h1><p>Hvis vi bruger dine ord som citat, er det kun med dit fornavn og din alder. Din mailadresse bliver ikke offentliggjort.</p><div className="survey-personal"><label className="form-field">Navn<input required autoComplete="name" value={draft.name} maxLength={160} onChange={event => update("name", event.target.value)} /></label><label className="form-field">Mailadresse<input required type="email" autoComplete="email" value={draft.email} maxLength={254} onChange={event => update("email", event.target.value)} /></label><label className="form-field">Alder<input required type="number" inputMode="numeric" min={0} max={120} step={1} value={draft.age} onChange={event => update("age", event.target.value)} /></label><label className="form-field">Postnummer<input required inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{4}" maxLength={4} value={draft.postal_code} onChange={event => update("postal_code", event.target.value)} /></label></div>

      </>}
      {step === 2 && <><span className="eyebrow">DIT KARNEVAL</span><h1 ref={heading} tabIndex={-1}>Hvor mange gange har du ca. deltaget i Aalborg Karneval<span>?</span></h1><p>Som enten aktiv deltager eller tilskuer - Tæl både Karneval, Børnekarneval og Gløden med.</p><label className="form-field survey-count">Antal gange<input type="number" required inputMode="numeric" min={0} max={300} step={1} value={draft.participations} onChange={event => update("participations", event.target.value)} /></label><p className="survey-next-intro">I de næste spørgsmål vil vi gerne høre om dine personlige oplevelser, tanker og holdninger til Aalborg Karneval. Svar med dine egne ord</p></>}
      {question && <>
        <span className="eyebrow">{question.kind === "sentences" ? "FULDFØR SÆTNINGEN" : "DINE EGNE ORD"}</span>
        <h1 ref={heading} tabIndex={-1} className={question.id === "invitation" ? "survey-context-title" : undefined}>{question.kind === "sentences" ? "Aalborg Karneval er…" : question.title}</h1>
        <p id="survey-question-help" className={question.id === "invitation" ? "survey-question-help" : undefined}>{question.id === "traditions" ? "Vælg ja eller nej. Hvis ja, vil vi gerne høre om dine traditioner." : question.help}</p>
        {question.id === "traditions" ? <>
          <fieldset className="survey-choice"><legend className="survey-sr-only">Har du traditioner omkring Aalborg Karneval?</legend>{([["yes", "Ja"], ["no", "Nej"]] as const).map(([value, label]) => <label key={value}><input type="radio" name="traditions" required value={value} checked={traditionsChoice === value} onChange={() => { setTraditionsChoice(value); setError(""); setAnswers("traditions", [value === "no" ? "Nej" : traditionsText]); }} /><span>{label}</span></label>)}</fieldset>
          {traditionsChoice === "yes" && <label className="form-field">Hvilke traditioner har du?<textarea required rows={5} maxLength={3000} placeholder="Fortæl om dine traditioner …" value={traditionsText} onChange={event => { setTraditionsText(event.target.value); setAnswers("traditions", [event.target.value]); }} /></label>}
        </> : question.kind === "text" ? <label className="form-field"><span className="survey-sr-only">Dit svar</span><textarea rows={6} maxLength={3000} placeholder={question.id === "invitation" ? "Du skal være med til Aalborg Karneval næste år fordi..." : "Skriv med dine egne ord …"} value={draft.answers[question.id][0] || ""} onChange={event => setAnswers(question.id, [event.target.value])} /></label>
          : <SurveySentenceAnswers answers={draft.answers[question.id]} onChange={items => setAnswers(question.id, items)} />}
      </>}
      {step === CONTACT_STEP && <><span className="eyebrow">MÅ VI HØRE MERE?</span><h1 ref={heading} tabIndex={-1}>Må vi kontakte dig senere<span>?</span></h1><p>Hvis vi gerne vil høre mere uddybende om dine oplevelser.</p><fieldset className="survey-choice"><legend className="survey-sr-only">Tilladelse til senere kontakt</legend>{[["yes", "Ja, I må gerne kontakte mig"], ["no", "Nej tak"]].map(([value, label]) => <label key={value}><input type="radio" name="contact" required value={value} checked={draft.contact_permission === value} onChange={() => update("contact_permission", value)} /><span>{label}</span></label>)}</fieldset></>}
      {step === LAST_STEP && <><span className="eyebrow">ET SIDSTE KIG</span><h1 ref={heading} tabIndex={-1}>Din del af fortællingen<span>.</span></h1><p>Se dine svar igennem, før du sender dem.</p><div className="survey-review"><section><h2>Dine oplysninger</h2><p>{draft.name} · {draft.age} år · {draft.postal_code}</p><p>{draft.email}</p><p>Deltaget cirka {draft.participations} gange</p><button type="button" onClick={() => setStep(1)}>Ret oplysninger</button></section>{SURVEY_QUESTIONS.map((q, index) => <section key={q.id}><h2>{q.title}</h2>{draft.answers[q.id].filter(a => a.trim()).length ? draft.answers[q.id].filter(a => a.trim()).map((answer, i) => <p key={i}>{q.kind === "sentences" ? "Aalborg Karneval er… " : ""}{answer}</p>) : <p className="survey-small">Ikke besvaret</p>}<button type="button" onClick={() => setStep(index + 3)}>Ret svar</button></section>)}<section><h2>Senere kontakt</h2><p>{draft.contact_permission === "yes" ? "Ja, I må kontakte mig." : "Nej tak."}</p><button type="button" onClick={() => setStep(CONTACT_STEP)}>Ret valg</button></section></div><label className="survey-permission"><input type="checkbox" required checked={draft.publication_permission} onChange={event => update("publication_permission", event.target.checked)} /><span>Jeg accepterer, at Aalborg Karneval må bruge mine ord som citater i profilering af Aalborg Karneval med mit fornavn og min alder. Mine svar må indgå i arbejdet med grafisk identitet og kernefortælling.</span></label></>}
      {error && <p className="form-message error" role="alert">{error}</p>}
      <footer className="survey-actions">{step > 0 && <button className="quote-action-cancel" type="button" disabled={busy} onClick={() => { setError(""); setStep(current => current - 1); }}>Tilbage</button>}<button className="submit-quote" disabled={busy} type="submit">{busy ? "Sender …" : step === 0 ? "Deltag nu" : step === LAST_STEP ? (testMode ? "Se takkesiden" : "Send min besvarelse") : "Næste"}<UiIcon name="arrow" /></button></footer>
      {step === 1 && <section className="survey-email-note" aria-labelledby="survey-email-heading">
          <h2 id="survey-email-heading">Hvorfor spørger vi om din e-mailadresse?</h2>
          <p>Aalborg Karneval bruger din e-mailadresse til at kontakte dig, hvis du vinder konkurrencen, eller hvis vi har spørgsmål til din besvarelse.</p>
          <p>Vi opbevarer kun din e-mailadresse, så længe det er nødvendigt for at afslutte konkurrencen og følge op på eventuelle spørgsmål. Derefter sletter vi den.</p>
          <p>Du kan læse mere om, hvordan Aalborg Karneval behandler personoplysninger, i vores <a href="https://aalborgkarneval.dk/privatlivspolitik-2/" target="_blank" rel="noopener noreferrer">privatlivspolitik</a>.</p>
          <p>Har du spørgsmål til behandlingen af dine personoplysninger, kan du skrive til <a href="mailto:info@aalborgkarneval.dk">info@aalborgkarneval.dk</a>.</p>
        </section>}
    </form>}
  </div>;
}
