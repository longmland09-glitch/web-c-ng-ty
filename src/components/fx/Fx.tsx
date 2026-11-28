"use client";

import { useEffect } from "react";

/**
 * Page-wide motion layer, mounted once. Everything is opt-in via data attributes
 * and does nothing under prefers-reduced-motion:
 *  - [data-reveal]  : heading text splits into words that blur in, staggered (BlurText-style)
 *  - [data-count]   : number counts up from 0 when it scrolls into view (CountUp-style)
 *  - [data-draw]    : gets data-drawn once visible (CSS draws lines / timelines)
 *  - .spot          : radial spotlight follows the pointer (SpotlightCard-style)
 */
export default function Fx() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    root.dataset.fx = reduce ? "off" : "on";
    if (reduce) {
      document.querySelectorAll<HTMLElement>("[data-draw]").forEach((el) => (el.dataset.drawn = ""));
      return;
    }

    // split headings into words once
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      if (el.dataset.split) return;
      el.dataset.split = "1";
      let i = 0;
      const walk = (node: Node) => {
        node.childNodes.forEach((c) => {
          if (c.nodeType === Node.TEXT_NODE) {
            const parts = (c.textContent ?? "").split(/(\s+)/);
            const frag = document.createDocumentFragment();
            parts.forEach((p) => {
              if (!p) return;
              if (/^\s+$/.test(p)) frag.append(p);
              else {
                const w = document.createElement("span");
                w.className = "fx-word";
                w.style.setProperty("--i", String(i++));
                w.textContent = p;
                frag.append(w);
              }
            });
            c.replaceWith(frag);
          } else if (c.nodeType === Node.ELEMENT_NODE) walk(c);
        });
      };
      walk(el);
    });

    const count = (el: HTMLElement) => {
      const to = parseFloat(el.dataset.count ?? "0");
      const dec = (el.dataset.count ?? "").split(".")[1]?.length ?? 0;
      const prefix = el.dataset.prefix ?? "", suffix = el.dataset.suffix ?? "";
      const t0 = performance.now(), dur = 1600;
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        el.textContent = prefix + (to * e).toFixed(dec) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target as HTMLElement;
          io.unobserve(el);
          if (el.hasAttribute("data-reveal")) el.dataset.shown = "";
          if (el.hasAttribute("data-count")) count(el);
          if (el.hasAttribute("data-draw")) el.dataset.drawn = "";
        }),
      { threshold: 0.35 },
    );
    document.querySelectorAll("[data-reveal],[data-count],[data-draw]").forEach((el) => io.observe(el));

    // spotlight: one delegated listener
    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.(".spot") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    // magnet: primary buttons lean toward a nearby mouse pointer
    let pulled: HTMLElement | null = null;
    const onMagnet = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const btn = (e.target as Element | null)?.closest?.(".btn-primary") as HTMLElement | null;
      if (pulled && pulled !== btn) {
        pulled.style.removeProperty("--tx");
        pulled.style.removeProperty("--ty");
        pulled = null;
      }
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--tx", `${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px`);
      btn.style.setProperty("--ty", `${((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1)}px`);
      pulled = btn;
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointermove", onMagnet, { passive: true });
    return () => {
      io.disconnect();
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointermove", onMagnet);
    };
  }, []);
  return null;
}
