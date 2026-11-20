import { acceptedExt, maxUploadBytes } from "@/lib/data";

/**
 * RFQ endpoint. Emails the request and its drawings through Resend
 * (https://resend.com) when these environment variables are set on the host:
 *   RESEND_API_KEY  – API key
 *   RFQ_TO          – inbox that receives requests, e.g. xm@xmit.com.tw
 *   RFQ_FROM        – verified sender, e.g. "Xinmiao RFQ <rfq@xinmiao.com.tw>"
 * Without them it answers 503 and the form tells the visitor to email instead.
 */
export const runtime = "nodejs";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const key = process.env.RESEND_API_KEY, to = process.env.RFQ_TO, from = process.env.RFQ_FROM;
  if (!key || !to || !from) return Response.json({ error: "not_configured" }, { status: 503 });

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const v = (k: string) => String(fd.get(k) ?? "").trim().slice(0, 2000);
  const files = fd.getAll("files").filter((f): f is File => typeof f === "object" && "arrayBuffer" in f);
  const total = files.reduce((n, f) => n + f.size, 0);

  if (!files.length || !v("name") || !v("company") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email")) || !(Number(v("quantity")) > 0))
    return Response.json({ error: "invalid" }, { status: 400 });
  if (total > maxUploadBytes) return Response.json({ error: "too_large" }, { status: 413 });
  if (files.some((f) => !acceptedExt.includes(f.name.slice(f.name.lastIndexOf(".")).toLowerCase())))
    return Response.json({ error: "bad_type" }, { status: 415 });

  const rows: [string, string][] = [
    ["Name", v("name")],
    ["Company", v("company")],
    ["Email", v("email")],
    ["Phone", v("phone")],
    ["Material", v("material")],
    ["Quantity", v("quantity")],
    ["Tolerance", v("tolerance")],
    ["Surface finish", v("finish")],
    ["Required by", v("deadline")],
    ["Language", v("locale")],
    ["Files", files.map((f) => `${f.name} (${Math.round(f.size / 1024)} KB)`).join(", ")],
  ];
  const html =
    `<h2>New RFQ from ${esc(v("company"))}</h2><table cellpadding="6">` +
    rows.filter(([, x]) => x).map(([k, x]) => `<tr><th align="left">${k}</th><td>${esc(x)}</td></tr>`).join("") +
    `</table><p><b>Notes</b><br>${esc(v("notes")).replace(/\n/g, "<br>")}</p>`;

  const attachments = await Promise.all(
    files.map(async (f) => ({ filename: f.name, content: Buffer.from(await f.arrayBuffer()).toString("base64") })),
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: v("email"),
      subject: `RFQ: ${v("company")} — ${v("material")} × ${v("quantity")}`,
      html,
      attachments,
    }),
  });
  if (!res.ok) return Response.json({ error: "send_failed" }, { status: 502 });
  return Response.json({ ok: true });
}
