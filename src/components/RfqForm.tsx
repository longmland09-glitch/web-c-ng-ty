"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import type { Dict } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import { acceptedExt, company, materials, maxUploadBytes } from "@/lib/data";

type Status = "idle" | "sending" | "ok" | "notConfigured" | "error";
const fmt = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`);
const ext = (n: string) => n.slice(n.lastIndexOf(".")).toLowerCase();

export default function RfqForm({ t, locale }: { t: Dict["rfq"]; locale: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [fileError, setFileError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const input = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const email = company.email;
  const total = files.reduce((n, f) => n + f.size, 0);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const ok: File[] = [];
    for (const f of Array.from(list)) {
      if (!acceptedExt.includes(ext(f.name))) {
        setFileError(fill(t.badType, { name: f.name }));
        continue;
      }
      if (!files.some((x) => x.name === f.name && x.size === f.size)) ok.push(f);
    }
    if (ok.length) {
      setFileError("");
      setErrors((e) => ({ ...e, files: "" }));
    }
    setFiles((cur) => [...cur, ...ok]);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    addFiles(e.dataTransfer.files);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    const next: Record<string, string> = {};
    if (!files.length) next.files = t.needFile;
    if (!v("quantity")) next.quantity = t.required;
    if (!v("name")) next.name = t.required;
    if (!v("company")) next.company = t.required;
    if (!v("email")) next.email = t.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) next.email = t.invalidEmail;
    if (total > maxUploadBytes) next.files = fill(t.tooLarge, { email });
    setErrors(next);
    const first = ["files", "quantity", "name", "company", "email"].find((k) => next[k]);
    if (first) {
      (first === "files" ? input.current : form.current?.querySelector<HTMLElement>(`[name="${first}"]`))?.focus();
      return;
    }
    fd.delete("files");
    files.forEach((f) => fd.append("files", f, f.name));
    fd.set("locale", locale);
    setStatus("sending");
    try {
      const res = await fetch("/api/rfq/", { method: "POST", body: fd });
      if (res.ok) {
        setStatus("ok");
        setFiles([]);
        form.current?.reset();
      } else setStatus(res.status === 503 ? "notConfigured" : "error");
    } catch {
      setStatus("error");
    }
  };

  const field = (name: string, label: string, opts: { type?: string; ph?: string; req?: boolean; auto?: string } = {}) => (
    <div className="field">
      <label htmlFor={`rfq-${name}`}>
        {label}
        {opts.req && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={`rfq-${name}`}
        name={name}
        type={opts.type ?? "text"}
        placeholder={opts.ph}
        autoComplete={opts.auto}
        required={opts.req}
        min={opts.type === "number" ? 1 : undefined}
        inputMode={opts.type === "number" ? "numeric" : undefined}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `rfq-${name}-err` : undefined}
        onInput={() => errors[name] && setErrors((e) => ({ ...e, [name]: "" }))}
      />
      {errors[name] && (
        <p className="err" id={`rfq-${name}-err`}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  if (status === "ok")
    return (
      <div className="rfq-done" role="status">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        <p>{t.success}</p>
        <button type="button" className="btn btn-ghost" onClick={() => setStatus("idle")}>
          {t.submit}
        </button>
      </div>
    );

  return (
    <form ref={form} className="rfq" noValidate onSubmit={submit}>
      <div
        className="drop"
        data-drag={drag || undefined}
        data-invalid={errors.files ? true : undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M14 6h14l10 10v26H14z" />
          <path d="M28 6v10h10M26 36V22M20 28l6-6 6 6" />
        </svg>
        <p className="drop-title">{t.drop}</p>
        <label className="btn btn-ghost drop-btn">
          {t.browse}
          <input
            ref={input}
            className="sr-only"
            type="file"
            name="files"
            multiple
            accept={acceptedExt.join(",")}
            aria-describedby="rfq-accept rfq-files-err"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <p className="drop-meta" id="rfq-accept">
          {t.accepted}
          <br />
          {fill(t.limit, { email })}
        </p>
        <div aria-live="polite">
          {(errors.files || fileError) && (
            <p className="err" id="rfq-files-err">
              {errors.files || fileError}
            </p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <ul className="file-list" aria-label={t.files}>
          {files.map((f) => (
            <li key={f.name + f.size}>
              <span className="file-ext">{ext(f.name).slice(1).toUpperCase()}</span>
              <span className="file-name">{f.name}</span>
              <span className="file-size">{fmt(f.size)}</span>
              <button type="button" onClick={() => setFiles((cur) => cur.filter((x) => x !== f))} aria-label={`${t.remove} ${f.name}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </li>
          ))}
          <li className="file-total" data-over={total > maxUploadBytes || undefined}>
            {fmt(total)} / 4 MB
          </li>
        </ul>
      )}

      <fieldset className="materials">
        <legend>{t.material}</legend>
        <div className="chips">
          {materials.map((m, i) => (
            <label key={m} className="chip">
              <input type="radio" name="material" value={m} defaultChecked={i === 0} />
              <span>{m}</span>
            </label>
          ))}
          <label className="chip">
            <input type="radio" name="material" value="other" />
            <span>{t.materialOther}</span>
          </label>
        </div>
      </fieldset>

      <div className="grid-3">
        {field("quantity", t.quantity, { type: "number", req: true })}
        {field("tolerance", t.tolerance, { ph: t.tolerancePh })}
        {field("finish", t.finish, { ph: t.finishPh })}
      </div>
      <div className="grid-2">
        {field("deadline", t.deadline, { type: "date" })}
        {field("phone", t.phone, { type: "tel", auto: "tel" })}
      </div>
      <div className="grid-3">
        {field("name", t.name, { req: true, auto: "name" })}
        {field("company", t.company, { req: true, auto: "organization" })}
        {field("email", t.email, { type: "email", req: true, auto: "email" })}
      </div>
      <div className="field">
        <label htmlFor="rfq-notes">{t.notes}</label>
        <textarea id="rfq-notes" name="notes" rows={4} />
      </div>

      <div aria-live="polite">
        {status === "notConfigured" && <p className="notice">{fill(t.notConfigured, { email })}</p>}
        {status === "error" && <p className="notice notice-err">{fill(t.error, { email })}</p>}
      </div>

      <div className="rfq-submit">
        <button type="submit" className="btn btn-primary" disabled={status === "sending"} data-busy={status === "sending" || undefined}>
          {status === "sending" ? t.sending : t.submit}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
        <p>{t.privacy}</p>
      </div>
    </form>
  );
}
