import type { Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Document from "@/components/Document";
import { isLocale, prefixedLocales } from "@/lib/i18n";

export const viewport: Viewport = { themeColor: "#111214", colorScheme: "dark" };
export const dynamicParams = false;
export const generateStaticParams = () => prefixedLocales.map((lang) => ({ lang }));

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <Document locale={lang}>{children}</Document>;
}
