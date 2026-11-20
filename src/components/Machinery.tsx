import type { Dict } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import { banners, company, machines, statedUnits } from "@/lib/data";
import Gallery from "./Gallery";
import RemoteImg from "./RemoteImg";

export default function Machinery({ t, cases, captions }: { t: Dict["machinery"]; cases: Dict["cases"]; captions: Dict["captions"] }) {
  const inspection = machines.find((m) => m.id === "inspection")!;
  return (
    <>
      <div className="mach-table" role="table" aria-label={t.title}>
        <div className="mach-row mach-head" role="row">
          <span role="columnheader">{t.cols.equipment}</span>
          <span role="columnheader">{t.cols.units}</span>
          <span role="columnheader">{t.cols.model}</span>
          <span role="columnheader">{t.cols.travel}</span>
          <span role="columnheader">{t.cols.notes}</span>
        </div>
        {machines.map((m) => {
          const slides = m.photos.map((ph) => ({ src: ph.src, caption: ph.caption ? captions[ph.caption] : t.groups[m.id] }));
          return (
            <div className="mach-group" role="rowgroup" key={m.id}>
              {m.models.map((md, k) => (
                <div className="mach-row" role="row" key={md.model}>
                  <span role="cell" className="mach-name">
                    {k === 0 && (
                      <>
                        {m.photos[0] && (
                          <Gallery title={t.groups[m.id]} slides={slides} labels={cases} className="mach-thumb">
                            <RemoteImg src={m.photos[0].src} alt={t.groups[m.id]} />
                            <span className="sr-only">
                              {slides.length} {t.photos}
                            </span>
                          </Gallery>
                        )}
                        <strong>{t.groups[m.id]}</strong>
                      </>
                    )}
                  </span>
                  <span role="cell" className="num" data-label={t.cols.units}>
                    {k === 0 ? (m.units ?? t.notStated) : ""}
                  </span>
                  <span role="cell" data-label={t.cols.model}>
                    {md.brand !== "—" && <span className="brand">{md.brand} </span>}
                    {md.model}
                  </span>
                  <span role="cell" className="num" data-label={t.cols.travel}>
                    {md.travel ?? t.notStated}
                  </span>
                  <span role="cell" data-label={t.cols.notes}>
                    {md.note && t.notes[md.note]}
                    {md.sheet && (
                      <a className="sheet" href={md.sheet} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
                        {t.sheet} · {md.model}
                      </a>
                    )}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <p className="mach-total">{fill(t.total, { n: statedUnits })}</p>

      <div className="metrology">
        <div className="metrology-media">
          <RemoteImg src={inspection.photos[0].src} alt={captions.keyence} />
        </div>
        <div className="metrology-body">
          <h3>{t.metrologyTitle}</h3>
          <p>{t.metrologyBody}</p>
          {company.certifications.length > 0 && (
            <div className="certs">
              <h4>{t.certTitle}</h4>
              <ul>
                {company.certifications.map((c) => (
                  <li key={c.name}>
                    <strong>{c.name}</strong>
                    <span>
                      {c.issuer}
                      {c.id ? ` · ${c.id}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <RemoteImg className="metrology-bg" src={banners.equipment} alt="" aria-hidden="true" />
      </div>
    </>
  );
}
