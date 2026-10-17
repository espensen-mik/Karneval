"use client";
import { useEffect, useRef, useState } from "react";
import UiIcon from "./ui-icon";

export default function SurveySentenceAnswers({ answers, onChange }: { answers: string[]; onChange: (answers: string[]) => void }) {
  const [celebration, setCelebration] = useState(0);
  const [cheering, setCheering] = useState(false);
  useEffect(() => {
    if (!celebration || !cheering) return;
    const timer = window.setTimeout(() => setCheering(false), 1500);
    return () => window.clearTimeout(timer);
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
    <div className="sentence-add-wrap">
      {cheering && <span className="sentence-thanks" role="status"><UiIcon name="thumb" /><span className="survey-sr-only">Tak for endnu en tanke!</span></span>}
    <button className="sentence-add" type="button" onClick={add} disabled={!items.at(-1)?.trim() || items.length >= 100}>
      <span className="sentence-add-icon" aria-hidden="true">+</span><span><strong>Tilføj endnu en sætning eller ord</strong><small>{items.length >= 100 ? "Du har nået 100 svar. Tak for alle dine tanker!" : !items.at(-1)?.trim() ? "Skriv i feltet ovenfor — så kan du tilføje en til." : "Har du en tanke mere? Giv den plads her."}</small></span><UiIcon className="sentence-add-arrow" name="arrow" />
    </button>
    </div>
    <div className="sentence-count" role="status" aria-live="polite" aria-atomic="true">
      <span className="sentence-score" key={count}>{count} svar</span>
      <div><strong>{count >= 100 ? "Tak for alle dine tanker!" : count === 1 ? "Der er plads til flere!" : "Hver tanke tæller!"}</strong><span>{count ? "Du gør os klogere. Hvad er Aalborg Karneval også?" : "Både enkelte ord og hele sætninger tæller."}</span></div>
    </div>
  </div>;
}
