import type { Viewport } from "next";
import type { ReactNode } from "react";
import Document from "@/components/Document";

export const viewport: Viewport = { themeColor: "#111214", colorScheme: "dark" };

export default function Layout({ children }: { children: ReactNode }) {
  return <Document locale="en">{children}</Document>;
}
