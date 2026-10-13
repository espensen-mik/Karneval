"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const categories = ["Generel", "Parade", "Kildeparken", "Børnekarneval", "Gløden"] as const;
type Quote = {
  id: string;
  quote_text: string;
  person_name: string;
  person_title: string;
  organization: string | null;
  quote_source: string | null;
  category: string;
  created_at: string;
};

export default function QuotesApp() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadQuotes() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/citater", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Citaterne kunne ikke hentes.");
      setQuotes(result);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Citaterne kunne ikke hentes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadQuotes(); }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("da");
    if (!term) return quotes;
    return quotes.filter((quote) =>
      [quote.quote_text, quote.person_name, quote.person_title, quote.organization, quote.quote_source, quote.category]
        .some((value) => value?.toLocaleLowerCase("da").includes(term)),
    );
  }, [query, quotes]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setSuccess("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      quote_text: String(data.get("quote_text") || ""),
      person_name: String(data.get("person_name") || ""),
      person_title: String(data.get("person_title") || ""),
      organization: String(data.get("organization") || ""),
      quote_source: String(data.get("quote_source") || ""),
      category: String(data.get("category") || "Generel"),
      publication_consent: data.get("publication_consent") === "on",
    };
    try {
      const response = await fetch("/api/citater", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Citatet kunne ikke gemmes.");
      setQuotes((current) => [result, ...current]);
      setSuccess("Citatet er gemt og synligt i samlingen.");
      form.reset();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Citatet kunne ikke gemmes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="breadcrumbs"><Link href="/">RESEARCHRUM</Link><i>/</i> Citater</div>
        <div className="topbar-status"><span className="status-dot" /> {quotes.length} citater</div>
      </header>
      <section className="subpage-hero">
        <div className="eyebrow">STEMMER & PERSPEKTIVER</div>
        <h1>Citater<span className="title-period">.</span></h1>
        <p>En samling af udsagn om Aalborg Karneval. Tilføj et citat, eller søg på tværs af tekst, person, titel og kategori.</p>
      </section>
      <div className="quotes-layout">
        <section className="quotes-entry">
          <div className="quotes-panel-heading">
            <div className="eyebrow muted">NYT BIDRAG</div>
            <h2>Tilføj et citat</h2>
            <p>Udfyld citatet og den person, det stammer fra.</p>
          </div>
          <form className="quotes-form" onSubmit={submit}>
            <label className="form-field form-wide">Citat
              <textarea name="quote_text" rows={5} maxLength={3000} required placeholder="Skriv citatet her…" />
            </label>
            <label className="form-field">Navn
              <input name="person_name" maxLength={160} required placeholder="Personens navn" />
            </label>
            <label className="form-field">Titel
              <input name="person_title" maxLength={200} required placeholder="Fx arrangør" />
            </label>
            <label className="form-field">Firma eller organisation <span>(valgfrit)</span>
              <input name="organization" maxLength={200} placeholder="Organisation" />
            </label>
            <label className="form-field">Kilde eller anledning <span>(valgfrit)</span>
              <input name="quote_source" maxLength={500} placeholder="Fx interview, workshop eller spørgeskema" />
            </label>
            <label className="form-field form-wide">Kategori
              <select name="category" defaultValue="Generel">
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="consent-field form-wide">
              <input type="checkbox" name="publication_consent" required />
              <span>Jeg har tilladelse til at dele citatet og vise personens navn og oplysninger i dette researchrum.</span>
            </label>
            {formError && <p className="form-message error form-wide" role="alert">{formError}</p>}
            {success && <p className="form-message success form-wide" role="status">{success}</p>}
            <button className="submit-quote form-wide" type="submit" disabled={saving}>{saving ? "Gemmer…" : "Gem citat"} <span aria-hidden="true">↗</span></button>
            <p className="form-note form-wide">Citater vises straks efter indsendelse.</p>
          </form>
        </section>
        <section className="quotes-collection">
          <div className="quotes-collection-top">
            <div><div className="eyebrow muted">CITATSAMLING</div><h2>Stemmer fra karneval</h2></div>
            <span className="result-count">{filtered.length} {filtered.length === 1 ? "CITAT" : "CITATER"}</span>
          </div>
          <label className="quote-search">Søg i samlingen
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Søg i citater, personer, kategorier…" />
          </label>
          {loading && <div className="quotes-empty">Henter citater…</div>}
          {!loading && loadError && <div className="quotes-empty error">{loadError} <button type="button" onClick={() => void loadQuotes()}>Prøv igen</button></div>}
          {!loading && !loadError && filtered.length === 0 && <div className="quotes-empty">{query ? "Ingen citater matcher søgningen endnu." : "Her er plads til de første stemmer."}</div>}
          {!loading && !loadError && filtered.length > 0 && (
            <div className="quote-list">
              {filtered.map((quote) => (
                <article className="quote-card" key={quote.id}>
                  <span className="quote-mark" aria-hidden="true">“</span>
                  <span className="quote-category">{quote.category}</span>
                  <blockquote>{quote.quote_text}</blockquote>
                  <div className="quote-attribution"><strong>{quote.person_name}</strong><span>{quote.person_title}{quote.organization ? ` · ${quote.organization}` : ""}</span></div>
                  {quote.quote_source && <div className="quote-source">Kilde · {quote.quote_source}</div>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <footer className="page-footer"><span>SJÆLEN AF KARNEVAL <i>·</i> CITATSAMLING</span><span>ALLE INDSENDTE CITATER SYNLIGE</span></footer>
    </div>
  );
}
