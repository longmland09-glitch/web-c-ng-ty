import Home from "@/components/Home";
import { isLocale, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type P = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: P) {
  const { lang } = await params;
  return pageMetadata((isLocale(lang) ? lang : "en") as Locale);
}

export default async function Page({ params }: P) {
  const { lang } = await params;
  return <Home locale={lang as Locale} />;
}
