import type { Metadata } from "next";
import type { Locale } from "./i18n";
import { base, dictionaries, htmlLang, locales } from "./i18n";
import { banners } from "./data";

/** Set SITE_URL on the host (e.g. https://www.xinmiao.com.tw) for absolute canonical URLs. */
const siteUrl = process.env.SITE_URL || "https://web-c-ng-ty.vercel.app";

export function pageMetadata(locale: Locale): Metadata {
  const t = dictionaries[locale];
  const languages: Record<string, string> = {};
  for (const l of locales) languages[htmlLang[l]] = base(l) + "/";
  languages["x-default"] = "/";
  return {
    metadataBase: new URL(siteUrl),
    title: t.meta.title,
    description: t.meta.description,
    alternates: { canonical: base(locale) + "/", languages },
    openGraph: { type: "website", title: t.meta.title, description: t.meta.description, url: base(locale) + "/", images: [banners.equipment] },
  };
}
