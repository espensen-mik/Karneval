"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Quote = {
  id: string;
  quote_text: string;
  person_name: string;
  person_title: string;
  organization: string | null;
  category: string;
};

function cleanQuote(text: string) {
  return text.trim().replace(/^[“„"]+|[”"]+$/g, "").trim();
}

export default function HomeQuotes({ images }: { images: string[] }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setImageIndex(Math.floor(Math.random() * images.length));
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
  }, [images.length]);

  const quoteLength = selected?.quote_text.length ?? 0;
  const quoteSizeClass = quoteLength > 480
    ? "quote-size-extra-long"
    : quoteLength > 300
      ? "quote-size-long"
      : quoteLength > 170
        ? "quote-size-medium"
        : "";

  function showAnotherPair() {
    if (quotes.length > 1) {
      const otherQuotes = quotes.filter((quote) => quote.id !== selected?.id);
      setSelected(otherQuotes[Math.floor(Math.random() * otherQuotes.length)]);
    }
    if (images.length > 1) {
      setImageIndex((current) => (current + 1 + Math.floor(Math.random() * (images.length - 1))) % images.length);
    }
  }

  return (
    <section className="quote-image-stage" aria-label="Et citat fra Aalborg Karneval">
      {images.length > 0 && <Image
        key={images[imageIndex]}
        className="quote-image-photo"
        src={images[imageIndex]}
        alt=""
        fill
        priority
        sizes="(max-width: 720px) 100vw, calc(100vw - 244px)"
      />}
      <div className="quote-image-shade" />
      <div className={`quote-image-content ${quoteSizeClass}`} aria-live="polite">
        {selected ? (
          <>
            <blockquote>{cleanQuote(selected.quote_text)}</blockquote>
            <div className="quote-image-attribution">
              <strong>{selected.person_name}</strong>
              <span>{selected.person_title}{selected.organization ? " · " + selected.organization : ""}</span>
            </div>
          </>
        ) : (
          <blockquote>{loading ? "…" : "Her er plads til den første stemme fra karneval."}</blockquote>
        )}
      </div>
      <button
        className="quote-image-refresh"
        type="button"
        onClick={showAnotherPair}
        disabled={loading || (quotes.length < 2 && images.length < 2)}
        aria-label="Vis et nyt citat og billede"
        title="Vis et nyt citat og billede"
      >
        <span aria-hidden="true">↻</span>
      </button>
    </section>
  );
}
