import type { Dict } from "@/lib/i18n";
import { company } from "@/lib/data";

export default function Footer({ t }: { t: Dict }) {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <p>
          <strong>{company.nameEn}</strong> <span lang="zh-Hant-TW">{company.nameZh}</span>
        </p>
        <p>
          © {new Date().getFullYear()} {company.short}. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
