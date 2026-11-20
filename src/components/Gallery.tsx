"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import RemoteImg from "./RemoteImg";

export type Slide = { src: string; caption: string };

/** A trigger plus a modal photo viewer (native <dialog>: Esc closes, focus is trapped). */
export default function Gallery({
  title,
  slides,
  labels,
  className,
  children,
}: {
  title: string;
  slides: Slide[];
  labels: { close: string; prev: string; next: string };
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  const n = slides.length;
  const go = (d: number) => setI((v) => (v + d + n) % n);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    d.addEventListener("keydown", onKey);
    return () => d.removeEventListener("keydown", onKey);
  });

  const open = () => {
    setI(0);
    ref.current?.showModal();
  };

  return (
    <>
      <button type="button" className={className} onClick={open} disabled={!n}>
        {children}
      </button>
      <dialog
        ref={ref}
        className="lightbox"
        aria-label={title}
        onClick={(e) => e.target === ref.current && ref.current?.close()}
      >
        {n > 0 && (
          <div className="lightbox-inner">
            <header>
              <h3>{title}</h3>
              <span className="lightbox-count">
                {i + 1} / {n}
              </span>
              <button type="button" className="icon-btn" onClick={() => ref.current?.close()} aria-label={labels.close}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </header>
            <figure>
              <RemoteImg key={slides[i].src} src={slides[i].src} alt={slides[i].caption || title} loading="eager" />
              {slides[i].caption && <figcaption>{slides[i].caption}</figcaption>}
            </figure>
            {n > 1 && (
              <div className="lightbox-nav">
                <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label={labels.prev}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                </button>
                <ol className="thumbs">
                  {slides.map((s, k) => (
                    <li key={s.src}>
                      <button type="button" aria-current={k === i || undefined} aria-label={`${k + 1}`} onClick={() => setI(k)}>
                        <RemoteImg src={s.src} alt="" />
                      </button>
                    </li>
                  ))}
                </ol>
                <button type="button" className="icon-btn" onClick={() => go(1)} aria-label={labels.next}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
