"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import QuoteImageContent, { type ImageQuote } from "./quote-image-content";

type Frame = { id: string; source: string | null; quote: ImageQuote | null };

/** Keep the visible slide mounted until the replacement bitmap has decoded. */
export default function QuoteSlideshow({ source, quote, playing, loading, expanded, onDisplayed }: {
  source: string | null; quote: (ImageQuote & { id: string }) | null;
  playing: boolean; loading: boolean; expanded: boolean; onDisplayed: () => void;
}) {
  const target = `${source ?? ""}:${quote?.id ?? ""}`;
  const [frames, setFrames] = useState<Frame[]>([{ id: target, source, quote }]);
  const [visible, setVisible] = useState(target);
  const visibleRef = useRef(target);
  const targetRef = useRef(target);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeFrame = useRef<number | null>(null);
  const displayed = useRef(onDisplayed);
  displayed.current = onDisplayed;
  targetRef.current = target;

  useEffect(() => {
    setFrames(previous => {
      if (previous.some(frame => frame.id === target)) return previous;
      return [...previous.filter(frame => frame.id === visibleRef.current), { id: target, source, quote }];
    });
  }, [target, source, quote]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (fadeFrame.current !== null) cancelAnimationFrame(fadeFrame.current);
  }, []);

  function reveal(id: string) {
    if (id !== targetRef.current || id === visibleRef.current) return;
    if (timer.current) clearTimeout(timer.current);
    if (fadeFrame.current !== null) cancelAnimationFrame(fadeFrame.current);
    fadeFrame.current = requestAnimationFrame(() => {
      fadeFrame.current = null;
      if (id !== targetRef.current) return;
      visibleRef.current = id;
      setVisible(id);
      displayed.current();
      const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500;
      timer.current = setTimeout(() => {
        // Preserve a newer pending slide when the user skips rapidly.
        setFrames(previous => previous.filter(frame => frame.id === id || frame.id === targetRef.current));
        timer.current = null;
      }, duration);
    });
  }

  useEffect(() => { if (!source) reveal(target); }, [source, target]);

  return <div className="quote-slideshow">
    {frames.map((frame, index) => <div key={frame.id} className={`quote-slide${index === 0 || frame.id === visible ? " quote-slide-visible" : ""}`} aria-hidden={frame.id !== visible}>
      {frame.source && <Image className="quote-image-photo" src={frame.source} alt="" fill priority sizes={expanded ? "100vw" : "(max-width: 720px) 100vw, calc(100vw - 244px)"}
        onLoad={event => {
          const photo = event.currentTarget;
          void photo.decode().then(() => reveal(frame.id)).catch(() => { /* Keep the existing slide if decoding fails. */ });
        }} />}
      <div className="quote-image-shade" />
      {frame.quote ? <QuoteImageContent quote={frame.quote} live="off" /> : <div className="quote-image-content"><blockquote>{loading ? "…" : "Her er plads til den første stemme fra karneval."}</blockquote></div>}
    </div>)}
    <span className="quote-slideshow-status" aria-live={playing ? "off" : "polite"}>{frames.find(frame => frame.id === visible)?.quote?.quote_text}</span>
  </div>;
}
