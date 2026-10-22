"use client";

import UiIcon from "./ui-icon";
import QuoteImageContent from "./quote-image-content";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Quote = {
  id: string;
  quote_text: string;
  person_name: string;
  person_title: string;
  organization: string | null;
  quote_source: string | null;
  category: string;
};

export default function HomeQuotes({ images }: { images: string[] }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cycle, setCycle] = useState(0);
  const stage = useRef<HTMLElement>(null);
  const fullscreenButton = useRef<HTMLButtonElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fallbackFullscreen, setFallbackFullscreen] = useState(false);

  useEffect(() => {
    function syncFullscreen() {
      const active = document.fullscreenElement === stage.current;
      setFullscreen(active);
      if (!active) fullscreenButton.current?.focus({ preventScroll: true });
    }
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    if (!fallbackFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFallbackFullscreen(false);
        fullscreenButton.current?.focus({ preventScroll: true });
      }
    }
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", escape);
    };
  }, [fallbackFullscreen]);

  async function toggleFullscreen() {
    if (fallbackFullscreen) { setFallbackFullscreen(false); return; }
    if (document.fullscreenElement === stage.current) { await document.exitFullscreen(); return; }
    try {
      if (!stage.current?.requestFullscreen) throw new Error("Fullscreen unavailable");
      await stage.current.requestFullscreen();
    } catch {
      // Browsers without element fullscreen still get an edge-to-edge presentation.
      setFallbackFullscreen(true);
    }
  }

  const expanded = fullscreen || fallbackFullscreen;

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

  const showAnotherPair = useCallback(() => {
    if (quotes.length > 1) {
      setSelected((current) => {
        const otherQuotes = quotes.filter((quote) => quote.id !== current?.id);
        return otherQuotes[Math.floor(Math.random() * otherQuotes.length)];
      });
    }
    if (images.length > 1) {
      setImageIndex((current) => (current + 1 + Math.floor(Math.random() * (images.length - 1))) % images.length);
    }
  }, [quotes, images.length]);

  useEffect(() => {
    if (!playing) return;
    let started = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      if (now - started >= 10_000) {
        showAnotherPair();
        started = now;
      }
      setProgress((now - started) / 10_000);
    }, 50);
    return () => window.clearInterval(timer);
  }, [playing, cycle, showAnotherPair]);

  const cannotChange = loading || (quotes.length < 2 && images.length < 2);
  const refresh = useCallback(() => {
    showAnotherPair();
    setProgress(0);
    setCycle((current) => current + 1);
  }, [showAnotherPair]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (cannotChange || event.defaultPrevented || event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.code !== "Space" && event.key !== "ArrowRight") return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.isContentEditable || target?.closest('input, textarea, select, [role="textbox"], [role="combobox"], [role="slider"]')) return;
      // Space keeps its native action when a link or button has keyboard focus.
      if (event.code === "Space" && target?.closest('button, a, summary, [role="button"]')) return;
      event.preventDefault();
      refresh();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cannotChange, refresh]);

  return (
    <section ref={stage} className={`quote-image-stage${fallbackFullscreen ? " quote-image-stage-expanded" : ""}`} aria-label="Et citat fra Aalborg Karneval">
      {images.length > 0 && <Image
        key={images[imageIndex]}
        className="quote-image-photo"
        src={images[imageIndex]}
        alt=""
        fill
        priority
        sizes={expanded ? "100vw" : "(max-width: 720px) 100vw, calc(100vw - 244px)"}
      />}
      <div className="quote-image-shade" />
      {selected ? <QuoteImageContent quote={selected} live={playing ? "off" : "polite"} /> : <div className="quote-image-content" aria-live="polite"><blockquote>{loading ? "…" : "Her er plads til den første stemme fra karneval."}</blockquote></div>}
      <div className="quote-image-controls">
      <button
        className="quote-image-play"
        type="button"
        disabled={cannotChange}
        aria-label={playing ? "Stop automatisk rotation" : "Start automatisk rotation hvert 10. sekund"}
        aria-pressed={playing}
        title={playing ? "Stop rotation" : "Play · skift hvert 10. sekund"}
        onClick={() => { setPlaying((current) => !current); setProgress(0); }}
      >
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle className="quote-play-track" cx="24" cy="24" r="21" />
          {playing && <circle className="quote-play-progress" cx="24" cy="24" r="21" pathLength="1" strokeDasharray="1" strokeDashoffset={progress} />}
          {playing ? <rect x="18" y="18" width="12" height="12" rx="1" /> : <path d="M20 16 L32 24 L20 32 Z" />}
        </svg>
        <span>{playing ? "Stop" : "Play"}</span>
      </button>
      <button
        className="quote-image-refresh"
        type="button"
        onClick={refresh}
        disabled={cannotChange}
        aria-label="Vis et nyt citat og billede"
        title="Vis et nyt citat og billede"
      >
        <span aria-hidden="true"><UiIcon name="refresh" /></span>
      </button>
      <button
        ref={fullscreenButton}
        className="quote-image-refresh"
        type="button"
        onClick={() => { void toggleFullscreen(); }}
        aria-label={expanded ? "Luk fuld skærm" : "Vis citat og billede i fuld skærm"}
        aria-pressed={expanded}
        title={expanded ? "Luk fuld skærm" : "Fuld skærm"}
      ><UiIcon name={expanded ? "close" : "expand"} /></button>
      </div>
    </section>
  );
}
