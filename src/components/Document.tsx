import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { dictionaries, htmlLang } from "@/lib/i18n";
import { company } from "@/lib/data";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@/app/globals.css";

export default function Document({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = dictionaries[locale];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.nameEn,
    alternateName: company.nameZh,
    foundingDate: String(company.founded),
    email: company.email,
    telephone: company.phone,
    faxNumber: company.fax,
    description: t.meta.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: "No. 95-6, Jiangshan Rd.",
      addressLocality: "Daliao Dist., Kaohsiung City",
      postalCode: "831",
      addressCountry: "TW",
    },
    logo: company.logo,
  };
  return (
    <html lang={htmlLang[locale]}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
