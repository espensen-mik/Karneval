"use client";
import { useEffect, useRef } from "react";
import UiIcon from "./ui-icon";

export default function SurveySentenceAnswers({ answers, onChange }: { answers: string[]; onChange: (answers: string[]) => void }) {
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
  }
  return <div className="sentence-workspace">
    <div className="sentence-answers">
      {items.map((answer, index) => <div className="sentence-answer" key={index}>
        <span className="sentence-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <label className="sentence-field"><span className="survey-sr-only">Karneval er… svar {index + 1}</span><textarea
          ref={element => { if (element) fields.current.set(index, element); else fields.current.delete(index); }}
          rows={1} maxLength={3000} value={answer} placeholder={index === 0 ? "Skriv din første tanke …" : "Og hvad er karneval også?"}
          onChange={event => { const next = [...items]; next[index] = event.target.value; onChange(next); }}
        /></label>
        {items.length > 1 && <button type="button" className="sentence-remove" aria-label={`Fjern sætning ${index + 1}`} onClick={() => onChange(items.filter((_, i) => i !== index))}><UiIcon name="close" /></button>}
      </div>)}
    </div>
    <button className="sentence-add" type="button" onClick={add} disabled={!items.at(-1)?.trim() || items.length >= 100}>
      <span className="sentence-add-icon" aria-hidden="true">+</span><span><strong>Tilføj endnu en sætning</strong><small>{count ? "Hvad er karneval også for dig?" : "Der er plads til mere end én tanke."}</small></span><UiIcon className="sentence-add-arrow" name="arrow" />
    </button>
    <p className="sentence-count" aria-live="polite">{count > 0 ? `${count} ${count === 1 ? "sætning" : "sætninger"} — tilføj gerne flere, hvis du har lyst.` : "Du må skrive lige så mange sætninger, du har lyst til."}</p>
  </div>;
}
