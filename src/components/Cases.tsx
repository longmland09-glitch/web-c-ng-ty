"use client";

import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { products, type Industry } from "@/lib/data";
import Gallery from "./Gallery";
import RemoteImg from "./RemoteImg";

type Filter = "all" | Industry;

export default function Cases({ t, captions }: { t: Dict["cases"]; captions: Dict["captions"] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const list = products.filter((p) => filter === "all" || p.industry === filter);
  const filters: Filter[] = ["all", "semi", "mould", "auto"];

  return (
    <>
      <div className="filters" role="group" aria-label={t.label}>
        {filters.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {t.filters[f]}
            <span className="count">{f === "all" ? products.length : products.filter((p) => p.industry === f).length}</span>
          </button>
        ))}
      </div>

      <ul className="case-grid" aria-live="polite">
        {list.map((p) => {
          const item = t.items[p.id];
          const slides = p.photos.map((ph) => ({ src: ph.src, caption: ph.caption ? captions[ph.caption] : "" }));
          return (
            <li key={p.id} className="case-card spot" data-industry={p.industry}>
              <div className="case-media">
                {p.photos[0] ? (
                  <RemoteImg src={p.photos[0].src} alt={item.name} style={{ objectPosition: p.photos[0].position }} />
                ) : (
                  <span className="img-fallback">
                    <span>{t.noPhoto}</span>
                  </span>
                )}
                <span className="case-tag">{t.filters[p.industry]}</span>
              </div>
              <div className="case-body">
                <h3>{item.name}</h3>
                <p>{item.desc}</p>
                {(p.tolerance || p.finish) && (
                  <dl className="case-specs">
                    {p.tolerance && (
                      <div>
                        <dt>{t.tolerance}</dt>
                        <dd>{p.tolerance}</dd>
                      </div>
                    )}
                    {p.finish && (
                      <div>
                        <dt>{t.finish}</dt>
                        <dd>{p.finish}</dd>
                      </div>
                    )}
                  </dl>
                )}
                {slides.length > 0 && (
                  <Gallery title={item.name} slides={slides} labels={t} className="case-open">
                    {t.view}
                    <span>
                      {slides.length} {t.photos}
                    </span>
                  </Gallery>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
