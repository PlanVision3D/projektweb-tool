"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { MediaImage } from "@/types/content";
import styles from "./modern.module.css";

/** Barrierearmer Bild-Slider mit großen Pfeiltasten, Punkten und Lightbox (Popup). */
export default function Slider({ images }: { images: MediaImage[] }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  if (images.length === 0) return null;
  const go = (d: number) => setI((p) => (p + d + images.length) % images.length);
  const cur = images[i];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, images.length]);

  return (
    <div className={styles.slider}>
      <div className={styles.sliderStage}>
        <img src={cur.url} alt={cur.alt || cur.caption || ""} className={styles.sliderZoom} onClick={() => setOpen(true)} title="Zum Vergrößern klicken" loading="lazy" decoding="async" />
        {images.length > 1 && (
          <>
            <button className={`${styles.sliderArrow} ${styles.sliderPrev}`} onClick={() => go(-1)} aria-label="Vorheriges Bild">‹</button>
            <button className={`${styles.sliderArrow} ${styles.sliderNext}`} onClick={() => go(1)} aria-label="Nächstes Bild">›</button>
          </>
        )}
        <button className={styles.sliderExpand} onClick={() => setOpen(true)} aria-label="Bild vergrößern">⤢</button>
        {cur.caption && <div className={styles.sliderCaption}>{cur.caption}</div>}
      </div>
      {images.length > 1 && (
        <div className={styles.sliderDots}>
          {images.map((_, n) => (
            <button key={n} className={`${styles.dot} ${n === i ? styles.dotActive : ""}`} onClick={() => setI(n)} aria-label={`Bild ${n + 1}`} />
          ))}
        </div>
      )}

      {open && typeof document !== "undefined" && createPortal(
        <div className={styles.lightbox} onClick={() => setOpen(false)}>
          <button className={styles.lbClose} onClick={() => setOpen(false)} aria-label="Schließen">×</button>
          {images.length > 1 && (
            <button className={`${styles.lbArrow} ${styles.lbPrev}`} onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Vorheriges Bild">‹</button>
          )}
          <figure className={styles.lbFigure} onClick={(e) => e.stopPropagation()}>
            <img src={cur.url} alt={cur.alt || cur.caption || ""} />
            {cur.caption && <figcaption>{cur.caption}</figcaption>}
          </figure>
          {images.length > 1 && (
            <button className={`${styles.lbArrow} ${styles.lbNext}`} onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Nächstes Bild">›</button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
