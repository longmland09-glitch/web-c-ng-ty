import type { Locale } from "@/lib/i18n";
import { dictionaries } from "@/lib/i18n";
import { banners, company, history, machines } from "@/lib/data";
import Cases from "./Cases";
import Design3D from "./Design3D";
import Footer from "./Footer";
import Header from "./Header";
import Hero3D from "./Hero3D";
import Machinery from "./Machinery";
import RemoteImg from "./RemoteImg";
import RfqForm from "./RfqForm";

const photo = (id: string, i = 0) => machines.find((m) => m.id === id)!.photos[i].src;

export default function Home({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const tiles = [
    // photos that are not a machinery-card cover, so nothing repeats on the page
    { id: "wire", img: photo("wire", 3) },
    { id: "milling", img: photo("milling", 1) },
    { id: "drill", img: photo("drill", 1) },
    { id: "grinding", img: photo("grinding", 1) },
  ];

  return (
    <>
      <Header locale={locale} t={t} />
      <main id="main">
        {/* ───── Hero ───── */}
        <section className="hero" aria-labelledby="hero-title">
          <RemoteImg className="hero-bg" src={banners.equipment} alt="" aria-hidden="true" loading="eager" />
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">{t.hero.kicker}</p>
              <h1 id="hero-title">
                <span>{t.hero.title1}</span>
                <span className="accent">{t.hero.title2}</span>
              </h1>
              <p className="lead">{t.hero.lead}</p>
              <div className="actions">
                <a className="btn btn-primary" href="#rfq">
                  {t.hero.cta}
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>
                </a>
                <a className="btn btn-ghost" href="#machinery">
                  {t.hero.secondary}
                </a>
              </div>
            </div>
            <Hero3D t={t.hero} />
          </div>
          <div className="wrap">
            <dl className="stats">
              <div>
                <dd>34</dd>
                <dt>{t.hero.stats.wire}</dt>
              </div>
              <div>
                <dd>27</dd>
                <dt>{t.hero.stats.mill}</dt>
              </div>
              <div>
                <dd>Ø0.2 mm</dd>
                <dt>{t.hero.stats.hole}</dt>
              </div>
              <div>
                <dd>{company.founded}</dd>
                <dt>{t.hero.stats.since}</dt>
              </div>
            </dl>
          </div>
        </section>

        {/* ───── Capabilities ───── */}
        <section id="capabilities" className="section" aria-labelledby="cap-title">
          <div className="wrap">
            <header className="sec-head">
              <p className="eyebrow">{t.services.label}</p>
              <h2 id="cap-title">{t.services.title}</h2>
              <p>{t.services.intro}</p>
            </header>
            <ul className="tiles">
              {tiles.map((tile) => (
                <li key={tile.id}>
                  <a href="#machinery" className="tile">
                    <RemoteImg src={tile.img} alt="" />
                    <span>{t.machinery.groups[tile.id]}</span>
                  </a>
                </li>
              ))}
            </ul>
            <ol className="services">
              {t.services.items.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───── RFQ ───── */}
        <section id="rfq" className="section rfq-section" aria-labelledby="rfq-title">
          <RemoteImg className="rfq-bg" src={banners.home} alt="" aria-hidden="true" />
          <div className="wrap rfq-grid">
            <header className="sec-head rfq-head">
              <p className="eyebrow">{t.rfq.label}</p>
              <h2 id="rfq-title">{t.rfq.title}</h2>
              <p>{t.rfq.intro}</p>
              <ul className="formats" aria-label={t.rfq.accepted}>
                {[".STEP", ".IGES", ".DXF", ".DWG", ".PDF"].map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </header>
            <RfqForm t={t.rfq} locale={locale} />
          </div>
        </section>

        {/* ───── Machinery ───── */}
        <section id="machinery" className="section" aria-labelledby="mach-title">
          <div className="wrap">
            <header className="sec-head">
              <p className="eyebrow">{t.machinery.label}</p>
              <h2 id="mach-title">{t.machinery.title}</h2>
              <p>{t.machinery.intro}</p>
            </header>
            <Machinery t={t.machinery} cases={t.cases} captions={t.captions} />
          </div>
        </section>

        {/* ───── Case studies ───── */}
        <section id="cases" className="section" aria-labelledby="cases-title">
          <div className="wrap">
            <header className="sec-head">
              <p className="eyebrow">{t.cases.label}</p>
              <h2 id="cases-title">{t.cases.title}</h2>
              <p>{t.cases.intro}</p>
            </header>
            <Cases t={t.cases} captions={t.captions} />
          </div>
        </section>

        {/* ───── 3D design ───── */}
        <section id="design3d" className="section design-section" aria-labelledby="d3-title">
          <div className="wrap">
            <header className="sec-head">
              <p className="eyebrow">{t.design.label}</p>
              <h2 id="d3-title">{t.design.title}</h2>
              <p>{t.design.intro}</p>
            </header>
            <Design3D t={t.design} />
          </div>
        </section>

        {/* ───── About ───── */}
        <section id="about" className="section about" aria-labelledby="about-title">
          <div className="wrap about-grid">
            <div>
              <p className="eyebrow">{t.about.label}</p>
              <h2 id="about-title">{t.about.title}</h2>
              {t.about.body.map((p) => (
                <p key={p} className="about-p">
                  {p}
                </p>
              ))}
              <h3 className="sub">{t.about.principlesTitle}</h3>
              <ul className="principles">
                {t.about.principles.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="about-media">
              <RemoteImg src={banners.about} alt={company.nameEn} />
              <RemoteImg src={banners.products} alt="" />
              <RemoteImg src={banners.news} alt="" />
            </div>
          </div>
          <div className="wrap">
            <h3 className="sub">{t.about.historyTitle}</h3>
            <ol className="timeline">
              {history.map((y) => (
                <li key={y}>
                  <span className="year">{y}</span>
                  <p>{t.about.history[y]}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───── Contact ───── */}
        <section id="contact" className="section contact" aria-labelledby="contact-title">
          <RemoteImg className="contact-bg" src={banners.contact} alt="" aria-hidden="true" />
          <div className="wrap contact-grid">
            <div>
              <p className="eyebrow">{t.contact.label}</p>
              <h2 id="contact-title">{t.contact.title}</h2>
              <dl className="contact-list">
                <div>
                  <dt>{t.contact.address}</dt>
                  <dd>
                    <span lang="zh-Hant-TW">{company.addressZh}</span>
                    <br />
                    <span lang="en">{company.addressEn}</span>
                  </dd>
                </div>
                <div>
                  <dt>{t.contact.phone}</dt>
                  <dd>
                    <a href={`tel:${company.phone.replace(/[^+\d]/g, "")}`}>{company.phone}</a>
                  </dd>
                </div>
                <div>
                  <dt>{t.contact.fax}</dt>
                  <dd>{company.fax}</dd>
                </div>
                <div>
                  <dt>{t.contact.email}</dt>
                  <dd>
                    <a href={`mailto:${company.email}`}>{company.email}</a>
                  </dd>
                </div>
                <div>
                  <dt>{t.contact.hours}</dt>
                  <dd>{t.contact.hoursValue}</dd>
                </div>
              </dl>
            </div>
            <div className="map">
              <iframe
                title={t.contact.map}
                src={`https://www.google.com/maps?q=${encodeURIComponent(company.mapQuery)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer t={t} />
    </>
  );
}
