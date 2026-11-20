import type { MetadataRoute } from "next";
import { base, locales } from "@/lib/i18n";

const siteUrl = process.env.SITE_URL || "https://web-c-ng-ty.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((l) => ({ url: `${siteUrl}${base(l)}/`, changeFrequency: "monthly", priority: l === "en" ? 1 : 0.9 }));
}
