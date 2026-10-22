export type ImageQuote = {
  quote_text: string;
  person_name: string;
  person_title: string;
  organization: string | null;
  quote_source?: string | null;
};

export default function QuoteImageContent({ quote, live = "polite" }: { quote: ImageQuote; live?: "off" | "polite" }) {
  const length = quote.quote_text.length;
  const size = length > 480 ? "quote-size-extra-long" : length > 300 ? "quote-size-long" : length > 170 ? "quote-size-medium" : "";
  return <div className={`quote-image-content ${size}`} aria-live={live}>
    <blockquote>{quote.quote_text.trim().replace(/^[“„"]+|[”"]+$/g, "").trim()}</blockquote>
    <div className="quote-image-attribution">
      <strong>{quote.person_name}</strong>
      <span className="quote-image-source">{[quote.person_title, quote.organization, quote.quote_source?.trim() ? `Kilde: ${quote.quote_source.trim()}` : null].filter(Boolean).join(" · ")}</span>
    </div>
  </div>;
}
