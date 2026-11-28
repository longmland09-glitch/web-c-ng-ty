import type { Dict } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import { company, machines, statedUnits } from "@/lib/data";
import Gallery from "./Gallery";
import MachineStage from "./MachineStage";

export default function Machinery({ t, cases, captions }: { t: Dict["machinery"]; cases: Dict["cases"]; captions: Dict["captions"] }) {
  return (
    <>
      <ul className="showcase">
        {machines.map((m) => {
          const slides = m.photos.map((ph) => ({ src: ph.src, caption: ph.caption ? captions[ph.caption] : t.groups[m.id] }));
          return (
            <li key={m.id} className="show-card">
              <Gallery title={t.groups[m.id]} slides={slides} labels={cases} className="show-open spot">
                <MachineStage src={m.cutout ?? m.photos[0].src} cutout={!!m.cutout} alt={t.groups[m.id]} />
                <span className="show-meta">
                  <span className="show-name">{t.groups[m.id]}</span>
                  {m.units && (
                    <span className="show-units">
                      {t.cols.units}: <b>{m.units}</b>
                    </span>
                  )}
                </span>
                <span className="show-models">
                  {m.models
                    .filter((md) => md.brand !== "—" || md.model)
                    .map((md) => (md.brand !== "—" ? `${md.brand} ${md.model}` : md.model))
                    .join(" · ")}
                </span>
                <span className="show-count">
                  {slides.length} {slides.length === 1 ? t.photo : t.photos}
                </span>
              </Gallery>
            </li>
          );
        })}
      </ul>

      <div className="mach-table" role="table" aria-label={t.title}>
        <div className="mach-row mach-head" role="row">
          <span role="columnheader">{t.cols.equipment}</span>
          <span role="columnheader">{t.cols.units}</span>
          <span role="columnheader">{t.cols.model}</span>
          <span role="columnheader">{t.cols.travel}</span>
          <span role="columnheader">{t.cols.notes}</span>
        </div>
        {machines.map((m) => {
          return (
            <div className="mach-group" role="rowgroup" key={m.id}>
              {m.models.map((md, k) => (
                <div className="mach-row" role="row" key={md.model}>
                  <span role="cell" className="mach-name">
                    {k === 0 && <strong>{t.groups[m.id]}</strong>}
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
      </div>
    </>
  );
}
