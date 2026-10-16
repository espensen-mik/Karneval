"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { exportQuoteJpeg } from "@/lib/quote-export";
import QuoteImageContent, { type ImageQuote } from "./quote-image-content";
import UiIcon from "./ui-icon";
import styles from "./quote-preview.module.css";

export default function QuotePreview({ quote, images, onClose }: { quote: ImageQuote; images: string[]; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const stage = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [image, setImage] = useState(() => images[Math.floor(Math.random() * images.length)]);
  useEffect(() => {
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  async function download() {
    if (!stage.current || !image || downloading) return;
    setDownloading(true); setError("");
    try {
      const blob = await exportQuoteJpeg(stage.current, image);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const name = quote.person_name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
      link.download = `karneval-citat-${name || "sjaelen"}.jpg`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { setError("Billedet kunne ikke gemmes. Prøv igen."); }
    finally { setDownloading(false); }
  }

  return <dialog className={styles.dialog} ref={dialog} aria-label={`Citat fra ${quote.person_name} i fuld skærm`} onClose={onClose}>
    <section className="quote-image-stage" ref={stage}>
      {image && <Image key={image} className="quote-image-photo" src={image} alt="" fill priority sizes="100vw" />}
      <div className="quote-image-shade" />
      <QuoteImageContent quote={quote} />
      {error && <p className={styles.message} role="alert">{error}</p>}
      <div className={styles.controls}>
      <button className={styles.close} type="button" aria-label={downloading ? "Gemmer JPG …" : "Download citat som JPG"} title="Download citat som JPG" disabled={downloading || !image} onClick={() => void download()}><UiIcon name="download" /></button>
      <button className={styles.close} type="button" aria-label="Vis et andet billede" title="Vis et andet billede" disabled={downloading || images.length < 2} onClick={() => setImage(current => {
        const otherImages = images.filter(candidate => candidate !== current);
        return otherImages[Math.floor(Math.random() * otherImages.length)] ?? current;
      })}><UiIcon name="refresh" /></button>
      <button className={styles.close} type="button" aria-label="Luk citatvisning" title="Luk citatvisning" onClick={() => dialog.current?.close()}><UiIcon name="close" /></button>
      </div>
    </section>
  </dialog>;
}
