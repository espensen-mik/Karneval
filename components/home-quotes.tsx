"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Quote = {
  id: string;
  quote_text: string;
  person_name: string;
  person_title: string;
  organization: string | null;
  quote_source: string | null;
  category: string;
};

function formatQuote(text: string) {
  return text.trim().replace(/^[“„"]+|[”"]+$/g, "").trim();
}
export default function HomeQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/citater", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Kunne ikke hente citater");
        return response.json();
      })
      .then((result: Quote[]) => {
        const items = Array.isArray(result) ? result : [];
        setQuotes(items);
        if (items.length) setSelected(items[Math.floor(Math.random() * items.length)]);
      })
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));
  }, []);

  function showAnotherQuote() {
    if (quotes.length < 2) return;
    const otherQuotes = quotes.filter((quote) => quote.id !== selected?.id);
    setSelected(otherQuotes[Math.floor(Math.random() * otherQuotes.length)]);
  }

  return (
    <div className="home-quotes">
      <div className="quote-feature" aria-live="polite">
        {loading ? (
          <p className="quote-feature-message">Henter citater…</p>
        ) : selected ? (
          <>
            <span className="quote-feature-mark" aria-hidden="true">“</span>
            <span className="quote-feature-category">{selected.category}</span>
            <blockquote>{formatQuote(selected.quote_text)}</blockquote>
            <div className="quote-feature-bottom">
              <div className="quote-feature-attribution">
                <strong>{selected.person_name}</strong>
                <span>{selected.person_title}{selected.organization ? " · " + selected.organization : ""}</span>
              </div>
              {selected.quote_source && <span className="quote-feature-source">{selected.quote_source}</span>}
            </div>
          </>
        ) : (
          <p className="quote-feature-message">De første stemmer fra karneval bliver samlet her.</p>
        )}
      </div>
      <div className="quote-feature-actions">
        <button
          className="quote-refresh"
          type="button"
          onClick={showAnotherQuote}
          disabled={loading || quotes.length < 2}
          aria-label="Vis et nyt tilfældigt citat"
        >
          <span aria-hidden="true">↻</span>
          <span>{quotes.length < 2 ? "Flere citater på vej" : "Et nyt citat"}</span>
        </button>
        <Link className="quote-all-link" href="/citater">Se alle citater <span>↗</span></Link>
      </div>
    </div>
  );
}
