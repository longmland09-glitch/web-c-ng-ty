"use client";

import { useRef, useState, type MouseEvent } from "react";

/** Copies a value; a burst of sparks flies from the click point (ClickSpark-style). */
export default function CopyButton({ value, label, done }: { value: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  const host = useRef<HTMLSpanElement>(null);

  const spark = (e: MouseEvent) => {
    const el = host.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX ? e.clientX - r.left : r.width / 2, y = e.clientY ? e.clientY - r.top : r.height / 2;
    for (let i = 0; i < 10; i++) {
      const s = document.createElement("i");
      s.className = "spark";
      const a = (i / 10) * Math.PI * 2;
      s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * 26}px;--dy:${Math.sin(a) * 26}px;--r:${a}rad`;
      el.append(s);
      setTimeout(() => s.remove(), 600);
    }
  };

  const copy = async (e: MouseEvent) => {
    spark(e);
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.prompt(label, value);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <span className="copy-wrap" ref={host}>
      <button type="button" className="copy-btn" onClick={copy} aria-label={`${label}: ${value}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {copied ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M9 9h10v10H9zM5 15V5h10" />}
        </svg>
        <span aria-live="polite">{copied ? done : label}</span>
      </button>
    </span>
  );
}
