"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Quote = {
  id: string;
  quote_text: string;
  person_name: string;
  person_title: string;
  organization: string | null;
  category: string;
};

export default function HomeQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/citater", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Kunne ikke hente citater");
        return response.json();
      })
      .then(setQuotes)
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-quotes">
      <div className="home-quotes-grid">
        {loading && <p className="home-quotes-empty">Henter citater fra samlingen…</p>}
        {!loading && quotes.length === 0 && <p className="home-quotes-empty">Citater og perspektiver bliver samlet her. Tilføj det første bidrag i citatsamlingen.</p>}
        {quotes.slice(0, 3).map((quote) => (
          <article className="home-quote-card" key={quote.id}>
            <span className="quote-category">{quote.category}</span>
            <blockquote>“{quote.quote_text}”</blockquote>
            <div className="quote-attribution"><strong>{quote.person_name}</strong><span>{quote.person_title}{quote.organization ? " · " + quote.organization : ""}</span></div>
          </article>
        ))}
      </div>
      <Link className="text-link home-quotes-link" href="/citater">Åbn citatsamlingen <span>↗</span></Link>
    </div>
  );
}
