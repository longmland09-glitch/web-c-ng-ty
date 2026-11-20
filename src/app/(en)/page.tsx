import Home from "@/components/Home";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("en");

export default function Page() {
  return <Home locale="en" />;
}
