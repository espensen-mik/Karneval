"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import UiIcon from "./ui-icon";

const CHEERS = ["Du er go!", "Ja tak — bliv ved!", "Du gør os klogere!", "Tak for endnu en tanke!", "Der er plads til en til!"];

export default function SurveySentenceAnswers({ answers, onChange }: { answers: string[]; onChange: (answers: string[]) => void }) {
  const [celebration, setCelebration] = useState(0);
  const [cheering, setCheering] = useState(false);
  useEffect(() => {
    if (!celebration || !cheering) return;
    const dismiss = () => setCheering(false);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" || event.key.length === 1 || event.key === "Backspace" || event.key === "Enter") dismiss(); };
    const timer = window.setTimeout(dismiss, 1800);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", dismiss);
    return () => { window.clearTimeout(timer); window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", dismiss); };
  }, [celebration, cheering]);
  const fields = useRef(new Map<number, HTMLTextAreaElement>());
  const focusNext = useRef<number | null>(null);
  const items = answers.length ? answers : [""];
  const count = answers.filter(answer => answer.trim()).length;
  useEffect(() => {
    for (const field of fields.current.values()) {
      field.style.height = "auto";
      field.style.height = `${Math.max(64, field.scrollHeight)}px`;
    }
    if (focusNext.current !== null) {
      fields.current.get(focusNext.current)?.focus();
      focusNext.current = null;
    }
  }, [answers]);
  function add() {
    if (!items.at(-1)?.trim() || items.length >= 100) return;
    focusNext.current = items.length;
    onChange([...items, ""]);
    setCelebration(current => current + 1);
    setCheering(true);
  }
  return <div className="sentence-workspace">
    <div className="sentence-answers">
      {items.map((answer, index) => <div className="sentence-answer" key={index}>
        <span className="sentence-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <label className="sentence-field"><span className="survey-sr-only">Aalborg Karneval er… svar {index + 1}</span><textarea
          ref={element => { if (element) fields.current.set(index, element); else fields.current.delete(index); }}
          rows={1} maxLength={3000} value={answer} placeholder="Aalborg Karneval er..."
          onChange={event => { const next = [...items]; next[index] = event.target.value; onChange(next); }}
        /></label>
        {items.length > 1 && <button type="button" className="sentence-remove" aria-label={`Fjern sætning ${index + 1}`} onClick={() => onChange(items.filter((_, i) => i !== index))}><UiIcon name="close" /></button>}
      </div>)}
    </div>
    {cheering && createPortal(<div className="sentence-celebration" key={celebration}>
      <div className="sentence-celebration-rays" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--ray-angle": `${index * 30}deg` } as CSSProperties}><span /></i>)}</div>
      <div className="sentence-celebration-content"><UiIcon className="sentence-celebration-symbol" name="heart" /><p role="status" aria-live="polite">{CHEERS[(celebration - 1) % CHEERS.length]}</p></div>
    </div>, document.body)}
    <button className="sentence-add" type="button" onClick={add} disabled={!items.at(-1)?.trim() || items.length >= 100}>
      <span className="sentence-add-icon" aria-hidden="true">+</span><span><strong>Tilføj endnu en sætning eller ord</strong><small>{items.length >= 100 ? "Du har nået 100 svar. Tak for alle dine tanker!" : !items.at(-1)?.trim() ? "Skriv i feltet ovenfor — så kan du tilføje en til." : "Har du en tanke mere? Giv den plads her."}</small></span><UiIcon className="sentence-add-arrow" name="arrow" />
    </button>
    <div className="sentence-count" role="status" aria-live="polite" aria-atomic="true">
      <span className="sentence-score" key={count}>{count} svar</span>
      <div><strong>{count >= 100 ? "Tak for alle dine tanker!" : count === 1 ? "Der er plads til flere!" : "Hver tanke tæller!"}</strong><span>{count ? "Du gør os klogere. Hvad er Aalborg Karneval også?" : "Både enkelte ord og hele sætninger tæller."}</span></div>
    </div>
  </div>;
}
