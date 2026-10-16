"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import QuoteImageContent, { type ImageQuote } from "./quote-image-content";
import UiIcon from "./ui-icon";
import styles from "./quote-preview.module.css";

export default function QuotePreview({ quote, images, onClose }: { quote: ImageQuote; images: string[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [image, setImage] = useState(() => images[Math.floor(Math.random() * images.length)]);
  useEffect(() => {
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  return <dialog className={styles.dialog} ref={dialog} aria-label={`Citat fra ${quote.person_name} i fuld skærm`} onClose={onClose}>
    <section className="quote-image-stage">
      {image && <Image key={image} className="quote-image-photo" src={image} alt="" fill priority sizes="100vw" />}
      <div className="quote-image-shade" />
      <QuoteImageContent quote={quote} />
      <div className={styles.controls}>
      <button className={styles.close} type="button" aria-label="Vis et andet billede" title="Vis et andet billede" disabled={images.length < 2} onClick={() => setImage(current => {
        const otherImages = images.filter(candidate => candidate !== current);
        return otherImages[Math.floor(Math.random() * otherImages.length)] ?? current;
      })}><UiIcon name="refresh" /></button>
      <button className={styles.close} type="button" aria-label="Luk citatvisning" title="Luk citatvisning" onClick={() => dialog.current?.close()}><UiIcon name="close" /></button>
      </div>
    </section>
  </dialog>;
}
