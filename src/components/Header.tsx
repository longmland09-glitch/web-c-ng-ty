"use client";

import { useEffect, useRef, useState } from "react";
import type { Dict, Locale } from "@/lib/i18n";
import { base, htmlLang, localeLabel, locales } from "@/lib/i18n";
import { company } from "@/lib/data";

export default function Header({ locale, t }: { locale: Locale; t: Dict }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const logo = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = logo.current;
    if (el && el.complete && el.naturalWidth === 0) setLogoOk(false);
  }, []);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  const items = [
    ["#capabilities", t.nav.services],
    ["#rfq", t.nav.rfq],
    ["#machinery", t.nav.machinery],
    ["#cases", t.nav.cases],
    ["#design3d", t.nav.design],
    ["#about", t.nav.about],
    ["#contact", t.nav.contact],
  ] as const;

  const langs = (
    <nav className="langs" aria-label={t.nav.language}>
      {locales.map((l) => (
        <a key={l} href={base(l) + "/"} hrefLang={htmlLang[l]} lang={htmlLang[l]} aria-current={l === locale ? "true" : undefined} title={localeLabel[l].name}>
          {localeLabel[l].short}
        </a>
      ))}
    </nav>
  );

  return (
    <header className="header" data-scrolled={scrolled || open}>
      <a className="skip" href="#main">
        {t.nav.skip}
      </a>
      <div className="wrap header-inner">
        <a className="brand" href={base(locale) + "/"}>
          {logoOk && (
            // eslint-disable-next-line @next/next/no-img-element
            <img ref={logo} src={company.logo} alt="" width={36} height={36} referrerPolicy="no-referrer" onError={() => setLogoOk(false)} />
          )}
          <span className="brand-text">
            <strong>{company.short}</strong>
            <span lang="zh-Hant-TW">芯淼國際</span>
          </span>
        </a>
        <nav className="nav" aria-label="Main">
          <ul>
            {items.map(([h, l]) => (
              <li key={h}>
                <a href={h}>{l}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-actions">
          <div className="desk">{langs}</div>
          <a className="btn btn-primary btn-sm desk" href="#rfq">
            {t.nav.quote}
          </a>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="mnav"
            aria-label={open ? t.nav.close : t.nav.menu}
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div id="mnav" className="mnav">
          <nav aria-label="Main">
            {items.map(([h, l]) => (
              <a key={h} href={h} onClick={() => setOpen(false)}>
                {l}
              </a>
            ))}
          </nav>
          {langs}
          <a className="btn btn-primary" href="#rfq" onClick={() => setOpen(false)}>
            {t.nav.quote}
          </a>
        </div>
      )}
    </header>
  );
}
